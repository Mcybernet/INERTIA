//! Test utama INERTIA (LiteSVM, in-process).
//!
//! Menutup sebagian besar matrix §13 di `PROGRAM_SPEC_MASS.md`:
//! init, seed, buy/sell, guard slippage/deadline, dan `add_mass`
//! (interval, cap, permissionless) termasuk time-travel `Clock`.

use {
    anchor_lang::{
        prelude::{Clock, Pubkey},
        solana_program::instruction::{AccountMeta, Instruction},
        AccountDeserialize, AnchorDeserialize, Discriminator, InstructionData, ToAccountMetas,
    },
    base64::{engine::general_purpose::STANDARD as B64, Engine},
    inertia_mass::constants::{
        DECIMAL_ADJ, MASS_INTERVAL_SECONDS, MIN_MASS_SOL, PRICE_SCALE, RENT_EXEMPT_MIN,
    },
    inertia_mass::events::{MassAdded, PoolInitialized, PoolSeeded, SwapEvent},
    inertia_mass::state::{Direction, PoolState},
    litesvm::{
        types::{TransactionMetadata, TransactionResult},
        LiteSVM,
    },
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
};

const TOKEN_DECIMALS: u8 = 6;
const SUPPLY: u64 = 50_000_000 * 1_000_000;
const POOL_TOKENS: u64 = 9_600_000 * 1_000_000;
const RESERVE_TOKENS: u64 = 10_000_000 * 1_000_000;
const POOL_SOL: u64 = 48_000_000_000;
const FEE_BPS: u16 = 30;
const DEVNET_INTERVAL: i64 = 60;

const SYSTEM_PROGRAM: &str = "11111111111111111111111111111111";
const TOKEN_PROGRAM: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ATA_PROGRAM: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const RENT_SYSVAR: &str = "SysvarRent111111111111111111111111111111111";

fn token_program_id() -> Pubkey {
    TOKEN_PROGRAM.parse().unwrap()
}

fn ata_program_id() -> Pubkey {
    ATA_PROGRAM.parse().unwrap()
}

fn system_program_id() -> Pubkey {
    SYSTEM_PROGRAM.parse().unwrap()
}

fn rent_sysvar_id() -> Pubkey {
    RENT_SYSVAR.parse().unwrap()
}

/// ATA dihitung manual supaya test tidak bergantung pada helper anchor-spl.
fn ata(wallet: &Pubkey, mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[
            wallet.as_ref(),
            token_program_id().as_ref(),
            mint.as_ref(),
        ],
        &ata_program_id(),
    )
    .0
}

fn program_bytes() -> &'static [u8] {
    include_bytes!(concat!(
        env!("CARGO_TARGET_TMPDIR"),
        "/../deploy/inertia_mass.so"
    ))
}

struct Env {
    svm: LiteSVM,
    payer: Keypair,
    init_logs: Vec<String>,
    mint: Pubkey,
    pool: Pubkey,
    vault_authority: Pubkey,
    reserve_authority: Pubkey,
    token_vault: Pubkey,
    mass_reserve_vault: Pubkey,
    sol_vault: Pubkey,
    fee_vault: Pubkey,
    payer_token: Pubkey,
}

// ---------------------------------------------------------------- helpers

fn send(svm: &mut LiteSVM, ixs: &[Instruction], signers: &[&Keypair]) -> TransactionResult {
    let attempt = |svm: &mut LiteSVM| -> TransactionResult {
        let blockhash = svm.latest_blockhash();
        let fee_payer = signers[0].pubkey();
        let msg = Message::new_with_blockhash(ixs, Some(&fee_payer), &blockhash);
        let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), signers).unwrap();
        svm.send_transaction(tx)
    };

    match attempt(svm) {
        // Beberapa guard test sengaja mengirim instruksi yang identik dua kali.
        // Dengan blockhash yang sama, runtime menolaknya sebagai AlreadyProcessed
        // sebelum program berjalan; pakai blockhash baru supaya guard-nya teruji.
        Err(e) if format!("{:?}", e.err).contains("AlreadyProcessed") => {
            svm.expire_blockhash();
            attempt(svm)
        }
        res => res,
    }
}

fn send_ok(svm: &mut LiteSVM, ixs: &[Instruction], signers: &[&Keypair]) {
    send_ok_meta(svm, ixs, signers);
}

fn send_ok_meta(
    svm: &mut LiteSVM,
    ixs: &[Instruction],
    signers: &[&Keypair],
) -> TransactionMetadata {
    let res = send(svm, ixs, signers);
    match res {
        Ok(meta) => meta,
        Err(e) => panic!("tx gagal: {:?}\nlogs: {:?}", e.err, e.meta.logs),
    }
}

/// Discriminator event mengikuti klien Anchor: `sha256("event:" + nama)[..8]`.
fn event_disc(name: &str) -> [u8; 8] {
    use sha2::{Digest, Sha256};
    let digest = Sha256::digest(format!("event:{name}").as_bytes());
    let mut disc = [0u8; 8];
    disc.copy_from_slice(&digest[..8]);
    disc
}

/// Ambil event dari log `Program data:` lalu deserialisasi payload Borsh.
fn decode_event<T: AnchorDeserialize>(logs: &[String], name: &str) -> T {
    let disc = event_disc(name);
    let payload = logs
        .iter()
        .filter_map(|line| line.strip_prefix("Program data: "))
        .map(|b64| B64.decode(b64).expect("base64 event valid"))
        .find(|bytes| bytes.len() > 8 && bytes[..8] == disc)
        .unwrap_or_else(|| panic!("event {name} tidak ditemukan di logs: {logs:?}"));
    T::deserialize(&mut &payload[8..]).expect("payload event valid")
}

/// Harga rata-rata yang dipakai Activity/candle frontend:
/// `sol_user / token_amount` dalam SOL per token, diskalakan 1e15.
fn avg_price_scaled(sol_user: u64, token_amount: u64) -> u128 {
    sol_user as u128 * (PRICE_SCALE as u128 / DECIMAL_ADJ as u128) / token_amount as u128
}

fn assert_err(res: TransactionResult, name: &str) {
    match res {
        Ok(_) => panic!("seharusnya gagal dengan {name}, tapi sukses"),
        Err(e) => {
            let logs = format!("{:?}", e.meta.logs);
            assert!(
                logs.contains(name),
                "error yang diharapkan {name}, err: {:?}, logs: {logs}",
                e.err
            );
        }
    }
}

fn assert_err_any(res: TransactionResult, names: &[&str]) {
    match res {
        Ok(_) => panic!("seharusnya gagal dengan {names:?}, tapi sukses"),
        Err(e) => {
            let logs = format!("{:?}", e.meta.logs);
            assert!(
                names.iter().any(|n| logs.contains(n)),
                "error yang diharapkan salah satu dari {names:?}, logs: {logs}"
            );
        }
    }
}

fn system_create_account_ix(
    from: &Pubkey,
    to: &Pubkey,
    lamports: u64,
    space: u64,
    owner: &Pubkey,
) -> Instruction {
    let mut data = Vec::with_capacity(52);
    data.extend_from_slice(&0u32.to_le_bytes()); // CreateAccount
    data.extend_from_slice(&lamports.to_le_bytes());
    data.extend_from_slice(&space.to_le_bytes());
    data.extend_from_slice(owner.as_ref());
    Instruction {
        program_id: system_program_id(),
        accounts: vec![AccountMeta::new(*from, true), AccountMeta::new(*to, true)],
        data,
    }
}

fn system_transfer_ix(from: &Pubkey, to: &Pubkey, lamports: u64) -> Instruction {
    let mut data = Vec::with_capacity(12);
    data.extend_from_slice(&2u32.to_le_bytes()); // Transfer
    data.extend_from_slice(&lamports.to_le_bytes());
    Instruction {
        program_id: system_program_id(),
        accounts: vec![
            AccountMeta::new(*from, true),
            AccountMeta::new(*to, false),
        ],
        data,
    }
}

fn token_ix(accounts: Vec<AccountMeta>, data: Vec<u8>) -> Instruction {
    Instruction {
        program_id: token_program_id(),
        accounts,
        data,
    }
}

fn create_mint(svm: &mut LiteSVM, payer: &Keypair, decimals: u8) -> Pubkey {
    let mint = Keypair::new();
    let rent = svm.minimum_balance_for_rent_exemption(82);
    let create = system_create_account_ix(
        &payer.pubkey(),
        &mint.pubkey(),
        rent,
        82,
        &token_program_id(),
    );

    // InitializeMint { decimals, mint_authority, freeze_authority: None }
    let mut data = vec![0u8, decimals];
    data.extend_from_slice(payer.pubkey().as_ref());
    data.extend_from_slice(&0u32.to_le_bytes());

    let init = token_ix(
        vec![
            AccountMeta::new(mint.pubkey(), false),
            AccountMeta::new_readonly(rent_sysvar_id(), false),
        ],
        data,
    );
    send_ok(svm, &[create, init], &[payer, &mint]);
    mint.pubkey()
}

fn create_token_account(
    svm: &mut LiteSVM,
    payer: &Keypair,
    mint: &Pubkey,
    owner: &Pubkey,
) -> Pubkey {
    let account = Keypair::new();
    let rent = svm.minimum_balance_for_rent_exemption(165);
    let create = system_create_account_ix(
        &payer.pubkey(),
        &account.pubkey(),
        rent,
        165,
        &token_program_id(),
    );

    let init = token_ix(
        vec![
            AccountMeta::new(account.pubkey(), false),
            AccountMeta::new_readonly(*mint, false),
            AccountMeta::new_readonly(*owner, false),
            AccountMeta::new_readonly(rent_sysvar_id(), false),
        ],
        vec![1u8], // InitializeAccount
    );
    send_ok(svm, &[create, init], &[payer, &account]);
    account.pubkey()
}

fn mint_to(svm: &mut LiteSVM, payer: &Keypair, mint: &Pubkey, to: &Pubkey, amount: u64) {
    let mut data = vec![7u8]; // MintTo
    data.extend_from_slice(&amount.to_le_bytes());
    let ix = token_ix(
        vec![
            AccountMeta::new(*mint, false),
            AccountMeta::new(*to, false),
            AccountMeta::new(payer.pubkey(), true),
        ],
        data,
    );
    send_ok(svm, &[ix], &[payer]);
}

fn pool_pda(mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[inertia_mass::state::POOL_SEED, mint.as_ref()],
        &inertia_mass::id(),
    )
    .0
}

fn read_pool(svm: &LiteSVM, pool: &Pubkey) -> PoolState {
    let account = svm.get_account(pool).expect("pool belum ada");
    let mut data: &[u8] = &account.data;
    PoolState::try_deserialize(&mut data).unwrap()
}

fn token_balance(svm: &LiteSVM, account: &Pubkey) -> u64 {
    let acc = svm.get_account(account).unwrap();
    u64::from_le_bytes(acc.data[64..72].try_into().unwrap())
}

fn price_scaled(token_reserve: u64, sol_reserve: u64) -> u64 {
    ((sol_reserve as u128 * PRICE_SCALE as u128)
        / (token_reserve as u128 * DECIMAL_ADJ as u128)) as u64
}

fn quote_buy(token_reserve: u64, sol_reserve: u64, amount_in: u64) -> (u64, u64, u64) {
    let fee = (amount_in as u128 * FEE_BPS as u128 / 10_000) as u64;
    let net = amount_in - fee;
    let out = (token_reserve as u128 * net as u128 / (sol_reserve + net) as u128) as u64;
    (fee, net, out)
}

fn quote_sell(token_reserve: u64, sol_reserve: u64, amount_in: u64) -> (u64, u64, u64) {
    let gross =
        (sol_reserve as u128 * amount_in as u128 / (token_reserve + amount_in) as u128) as u64;
    let fee = (gross as u128 * FEE_BPS as u128 / 10_000) as u64;
    (gross, fee, gross - fee)
}

// ---------------------------------------------------------------- setup

fn init_env(decimals: u8, interval: i64) -> Env {
    let mut svm = LiteSVM::new();
    svm.add_program(inertia_mass::id(), program_bytes()).unwrap();

    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 300_000_000_000).unwrap();

    let mint = create_mint(&mut svm, &payer, decimals);
    let pool = pool_pda(&mint);
    let (vault_authority, _) = Pubkey::find_program_address(
        &[inertia_mass::state::VAULT_AUTH_SEED, pool.as_ref()],
        &inertia_mass::id(),
    );
    let (reserve_authority, _) = Pubkey::find_program_address(
        &[inertia_mass::state::RESERVE_AUTH_SEED, pool.as_ref()],
        &inertia_mass::id(),
    );
    let (sol_vault, _) = Pubkey::find_program_address(
        &[inertia_mass::state::SOL_VAULT_SEED, pool.as_ref()],
        &inertia_mass::id(),
    );
    let (fee_vault, _) = Pubkey::find_program_address(
        &[inertia_mass::state::FEE_VAULT_SEED, pool.as_ref()],
        &inertia_mass::id(),
    );
    let token_vault = ata(&vault_authority, &mint);
    let mass_reserve_vault = ata(&reserve_authority, &mint);
    let payer_token = create_token_account(&mut svm, &payer, &mint, &payer.pubkey());
    mint_to(&mut svm, &payer, &mint, &payer_token, SUPPLY);

    let ix = Instruction::new_with_bytes(
        inertia_mass::id(),
        &inertia_mass::instruction::InitializePool {
            fee_bps: FEE_BPS,
            mass_interval: interval,
        }
        .data(),
        inertia_mass::accounts::InitializePool {
            authority: payer.pubkey(),
            mint,
            pool,
            vault_authority,
            reserve_authority,
            token_vault,
            mass_reserve_vault,
            sol_vault,
            fee_vault,
            token_program: token_program_id(),
            associated_token_program: ata_program_id(),
            system_program: system_program_id(),
        }
        .to_account_metas(None),
    );
    let init_logs = send_ok_meta(&mut svm, &[ix], &[&payer]).logs;

    Env {
        svm,
        payer,
        init_logs,
        mint,
        pool,
        vault_authority,
        reserve_authority,
        token_vault,
        mass_reserve_vault,
        sol_vault,
        fee_vault,
        payer_token,
    }
}

fn seed(env: &mut Env, token_amount: u64, sol_amount: u64) -> TransactionResult {
    let ix = Instruction::new_with_bytes(
        inertia_mass::id(),
        &inertia_mass::instruction::SeedLiquidity {
            token_amount,
            sol_amount,
        }
        .data(),
        inertia_mass::accounts::SeedLiquidity {
            authority: env.payer.pubkey(),
            pool: env.pool,
            mint: env.mint,
            authority_token_account: env.payer_token,
            token_vault: env.token_vault,
            vault_authority: env.vault_authority,
            sol_vault: env.sol_vault,
            token_program: token_program_id(),
            system_program: system_program_id(),
        }
        .to_account_metas(None),
    );
    send(&mut env.svm, &[ix], &[&env.payer])
}

fn seeded_env() -> Env {
    let mut env = init_env(TOKEN_DECIMALS, DEVNET_INTERVAL);
    seed(&mut env, POOL_TOKENS, POOL_SOL).unwrap();

    let (mint, mass_reserve_vault) = (env.mint, env.mass_reserve_vault);
    mint_to(&mut env.svm, &env.payer, &mint, &mass_reserve_vault, RESERVE_TOKENS);
    env
}

fn swap_ix(
    env: &Env,
    trader: &Pubkey,
    trader_token: &Pubkey,
    direction: Direction,
    amount_in: u64,
    min_out: u64,
    deadline: i64,
) -> Instruction {
    Instruction::new_with_bytes(
        inertia_mass::id(),
        &inertia_mass::instruction::Swap {
            direction,
            amount_in,
            min_amount_out: min_out,
            deadline,
        }
        .data(),
        inertia_mass::accounts::Swap {
            trader: *trader,
            pool: env.pool,
            mint: env.mint,
            trader_token_account: *trader_token,
            token_vault: env.token_vault,
            vault_authority: env.vault_authority,
            sol_vault: env.sol_vault,
            fee_vault: env.fee_vault,
            token_program: token_program_id(),
            system_program: system_program_id(),
        }
        .to_account_metas(None),
    )
}

fn add_mass_ix(env: &Env, caller: &Pubkey, amount_sol: u64, max_token_in: u64) -> Instruction {
    Instruction::new_with_bytes(
        inertia_mass::id(),
        &inertia_mass::instruction::AddMass {
            amount_sol,
            max_token_in,
        }
        .data(),
        inertia_mass::accounts::AddMass {
            caller: *caller,
            pool: env.pool,
            mint: env.mint,
            token_vault: env.token_vault,
            vault_authority: env.vault_authority,
            sol_vault: env.sol_vault,
            fee_vault: env.fee_vault,
            mass_reserve_vault: env.mass_reserve_vault,
            reserve_authority: env.reserve_authority,
            token_program: token_program_id(),
            system_program: system_program_id(),
        }
        .to_account_metas(None),
    )
}

fn fund_fee_vault(env: &mut Env, lamports: u64) {
    let ix = system_transfer_ix(&env.payer.pubkey(), &env.fee_vault, lamports);
    send_ok(&mut env.svm, &[ix], &[&env.payer]);
}

fn advance_clock(env: &mut Env, seconds: i64) {
    let mut clock: Clock = env.svm.get_sysvar();
    clock.unix_timestamp += seconds;
    env.svm.set_sysvar(&clock);
}

// ---------------------------------------------------------------- tests

#[test]
fn pool_state_size_is_272() {
    let env = init_env(TOKEN_DECIMALS, DEVNET_INTERVAL);
    let account = env.svm.get_account(&env.pool).unwrap();
    assert_eq!(account.data.len(), PoolState::SPACE);
    assert_eq!(PoolState::SPACE, 272);

    let pool = read_pool(&env.svm, &env.pool);
    assert_eq!(pool.fee_bps, FEE_BPS);
    assert_eq!(pool.mass_interval, DEVNET_INTERVAL);
    assert!(!pool.seeded);
    assert_eq!(pool.token_vault, env.token_vault);
    assert_eq!(pool.sol_vault, env.sol_vault);
    assert_eq!(pool.fee_vault, env.fee_vault);
    assert_eq!(pool.mass_reserve_vault, env.mass_reserve_vault);
}

#[test]
fn init_rejects_bad_fee_and_decimals() {
    let mut svm = LiteSVM::new();
    svm.add_program(inertia_mass::id(), program_bytes()).unwrap();
    let payer = Keypair::new();
    svm.airdrop(&payer.pubkey(), 100_000_000_000).unwrap();

    let build_init_ix = |mint: Pubkey, fee_bps: u16| {
        let pool = pool_pda(&mint);
        let (vault_authority, _) = Pubkey::find_program_address(
            &[inertia_mass::state::VAULT_AUTH_SEED, pool.as_ref()],
            &inertia_mass::id(),
        );
        let (reserve_authority, _) = Pubkey::find_program_address(
            &[inertia_mass::state::RESERVE_AUTH_SEED, pool.as_ref()],
            &inertia_mass::id(),
        );
        let (sol_vault, _) = Pubkey::find_program_address(
            &[inertia_mass::state::SOL_VAULT_SEED, pool.as_ref()],
            &inertia_mass::id(),
        );
        let (fee_vault, _) = Pubkey::find_program_address(
            &[inertia_mass::state::FEE_VAULT_SEED, pool.as_ref()],
            &inertia_mass::id(),
        );
        Instruction::new_with_bytes(
            inertia_mass::id(),
            &inertia_mass::instruction::InitializePool {
                fee_bps,
                mass_interval: DEVNET_INTERVAL,
            }
            .data(),
            inertia_mass::accounts::InitializePool {
                authority: payer.pubkey(),
                mint,
                pool,
                vault_authority,
                reserve_authority,
                token_vault: ata(&vault_authority, &mint),
                mass_reserve_vault: ata(&reserve_authority, &mint),
                sol_vault,
                fee_vault,
                token_program: token_program_id(),
                associated_token_program: ata_program_id(),
                system_program: system_program_id(),
            }
            .to_account_metas(None),
        )
    };

    let mint = create_mint(&mut svm, &payer, TOKEN_DECIMALS);
    let ix = build_init_ix(mint, 1_001);
    assert_err(send(&mut svm, &[ix], &[&payer]), "InvalidFeeBps");

    let mint9 = create_mint(&mut svm, &payer, 9);
    let ix = build_init_ix(mint9, FEE_BPS);
    assert_err(send(&mut svm, &[ix], &[&payer]), "InvalidMintDecimals");
}

#[test]
fn seed_sets_reserves_and_price() {
    let env = seeded_env();
    let pool = read_pool(&env.svm, &env.pool);

    assert!(pool.seeded);
    assert_eq!(pool.token_reserve, POOL_TOKENS);
    assert_eq!(pool.sol_reserve, POOL_SOL);
    assert_eq!(pool.price_scaled().unwrap(), 5_000_000_000);
    assert_eq!(
        pool.price_scaled().unwrap(),
        price_scaled(POOL_TOKENS, POOL_SOL)
    );

    assert_eq!(token_balance(&env.svm, &env.token_vault), POOL_TOKENS);
    assert!(
        env.svm.get_balance(&env.sol_vault).unwrap() >= POOL_SOL + RENT_EXEMPT_MIN
    );
    assert_eq!(pool.last_mass_ts, pool.launch_ts);
}

#[test]
fn seed_twice_fails_and_zero_fails() {
    let mut env = seeded_env();
    assert_err(seed(&mut env, 1_000_000, 1_000_000_000), "AlreadySeeded");

    let mut fresh = init_env(TOKEN_DECIMALS, DEVNET_INTERVAL);
    assert_err(seed(&mut fresh, 0, POOL_SOL), "ZeroAmount");
    assert_err(seed(&mut fresh, POOL_TOKENS, 0), "ZeroAmount");
}

#[test]
fn swap_before_seed_fails() {
    let mut env = init_env(TOKEN_DECIMALS, DEVNET_INTERVAL);
    let trader = Keypair::new();
    env.svm.airdrop(&trader.pubkey(), 10_000_000_000).unwrap();
    let trader_token = create_token_account(&mut env.svm, &trader, &env.mint, &trader.pubkey());

    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Buy,
        1_000_000_000,
        0,
        0,
    );
    assert_err(send(&mut env.svm, &[ix], &[&trader]), "NotSeeded");
}

#[test]
fn buy_then_sell_round_trip() {
    let mut env = seeded_env();
    let trader = Keypair::new();
    env.svm.airdrop(&trader.pubkey(), 20_000_000_000).unwrap();
    let trader_token = create_token_account(&mut env.svm, &trader, &env.mint, &trader.pubkey());

    // Beli 5,5 SOL dalam satu transaksi: tidak ada batas beli.
    let amount_in = 5_500_000_000;
    let (fee, net, out) = quote_buy(POOL_TOKENS, POOL_SOL, amount_in);
    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Buy,
        amount_in,
        out,
        0,
    );
    send_ok(&mut env.svm, &[ix], &[&trader]);

    let pool = read_pool(&env.svm, &env.pool);
    assert_eq!(pool.sol_reserve, POOL_SOL + net);
    assert_eq!(pool.token_reserve, POOL_TOKENS - out);
    assert_eq!(
        pool.price_scaled().unwrap(),
        price_scaled(pool.token_reserve, pool.sol_reserve)
    );
    assert_eq!(
        env.svm.get_balance(&env.fee_vault).unwrap(),
        RENT_EXEMPT_MIN + fee
    );

    // Jual seluruh token hasil beli.
    let bought = token_balance(&env.svm, &trader_token);
    assert_eq!(bought, out);
    let (gross, sell_fee, net_out) = quote_sell(pool.token_reserve, pool.sol_reserve, bought);
    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Sell,
        bought,
        net_out,
        0,
    );
    send_ok(&mut env.svm, &[ix], &[&trader]);

    let after = read_pool(&env.svm, &env.pool);
    assert_eq!(after.token_reserve, pool.token_reserve + bought);
    assert_eq!(after.sol_reserve, pool.sol_reserve - gross);
    assert_eq!(
        env.svm.get_balance(&env.fee_vault).unwrap(),
        RENT_EXEMPT_MIN + fee + sell_fee
    );

    // I9: pembulatan selalu menguntungkan pool, jadi `k` tidak boleh turun;
    // kenaikannya hanya sisa pembulatan (harus < 1 ppm).
    let k_before = POOL_TOKENS as u128 * POOL_SOL as u128;
    let k_after = after.token_reserve as u128 * after.sol_reserve as u128;
    assert!(k_after >= k_before, "k turun: {k_after} < {k_before}");
    let gain_ppm = (k_after - k_before) * 1_000_000 / k_before;
    assert!(gain_ppm < 1, "k naik {gain_ppm} ppm, di luar toleransi pembulatan");
}

#[test]
fn swap_guards_slippage_and_deadline() {
    let mut env = seeded_env();
    let trader = Keypair::new();
    env.svm.airdrop(&trader.pubkey(), 20_000_000_000).unwrap();
    let trader_token = create_token_account(&mut env.svm, &trader, &env.mint, &trader.pubkey());

    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Buy,
        1_000_000_000,
        u64::MAX,
        0,
    );
    assert_err(send(&mut env.svm, &[ix], &[&trader]), "SlippageExceeded");

    advance_clock(&mut env, 100);
    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Buy,
        1_000_000_000,
        0,
        1,
    );
    assert_err(send(&mut env.svm, &[ix], &[&trader]), "DeadlinePassed");
}

#[test]
fn add_mass_requires_interval_and_fee() {
    // A: interval belum lewat (fee vault kosong pun, error interval lebih dulu).
    let mut env = seeded_env();
    let caller = Keypair::new();
    env.svm.airdrop(&caller.pubkey(), 10_000_000_000).unwrap();
    let ix = add_mass_ix(&env, &caller.pubkey(), MIN_MASS_SOL, u64::MAX);
    assert_err(
        send(&mut env.svm, &[ix], &[&caller]),
        "MassIntervalNotElapsed",
    );

    // B: setengah interval, tetap ditolak.
    advance_clock(&mut env, DEVNET_INTERVAL / 2);
    let ix = add_mass_ix(&env, &caller.pubkey(), MIN_MASS_SOL, u64::MAX);
    assert_err(
        send(&mut env.svm, &[ix], &[&caller]),
        "MassIntervalNotElapsed",
    );

    // C: interval lewat tapi fee vault kosong.
    advance_clock(&mut env, DEVNET_INTERVAL);
    let ix = add_mass_ix(&env, &caller.pubkey(), MIN_MASS_SOL, u64::MAX);
    assert_err(send(&mut env.svm, &[ix], &[&caller]), "InsufficientFeeVault");

    // D: setelah fee diisi, panggilan pertama sukses; panggilan kedua langsung
    // setelahnya ditolak karena `last_mass_ts` sudah diperbarui.
    fund_fee_vault(&mut env, 2_000_000_000);
    let ix = add_mass_ix(&env, &caller.pubkey(), MIN_MASS_SOL, u64::MAX);
    send_ok(&mut env.svm, &[ix], &[&caller]);
    let ix = add_mass_ix(&env, &caller.pubkey(), MIN_MASS_SOL, u64::MAX);
    assert_err(
        send(&mut env.svm, &[ix], &[&caller]),
        "MassIntervalNotElapsed",
    );
}

#[test]
fn add_mass_success_is_permissionless_and_keeps_price() {
    let mut env = seeded_env();
    let caller = Keypair::new();
    env.svm.airdrop(&caller.pubkey(), 5_000_000_000).unwrap();
    fund_fee_vault(&mut env, 5_000_000_000);

    let before = read_pool(&env.svm, &env.pool);
    advance_clock(&mut env, MASS_INTERVAL_SECONDS);

    // ceil(1 SOL * token_reserve / sol_reserve) = 200.000 token
    let token_needed = ((MIN_MASS_SOL as u128 * before.token_reserve as u128
        + before.sol_reserve as u128
        - 1)
        / before.sol_reserve as u128) as u64;

    let ix = add_mass_ix(&env, &caller.pubkey(), MIN_MASS_SOL, token_needed);
    send_ok(&mut env.svm, &[ix], &[&caller]);

    let after = read_pool(&env.svm, &env.pool);
    assert_eq!(after.sol_reserve, before.sol_reserve + MIN_MASS_SOL);
    assert_eq!(after.token_reserve, before.token_reserve + token_needed);
    assert_eq!(after.total_mass_sol, MIN_MASS_SOL);
    assert_eq!(after.total_mass_token, token_needed);
    assert_eq!(
        env.svm.get_balance(&env.fee_vault).unwrap(),
        RENT_EXEMPT_MIN + 4_000_000_000
    );

    let drift = after.price_scaled().unwrap().abs_diff(before.price_scaled().unwrap()) as u128
        * 10_000
        / before.price_scaled().unwrap() as u128;
    assert!(drift <= 50, "drift {drift} bps");
}

#[test]
fn add_mass_respects_cap_and_max_token_in() {
    let mut env = seeded_env();
    let caller = Keypair::new();
    env.svm.airdrop(&caller.pubkey(), 10_000_000_000).unwrap();
    fund_fee_vault(&mut env, 10_000_000_000);

    let before = read_pool(&env.svm, &env.pool);
    advance_clock(&mut env, MASS_INTERVAL_SECONDS);

    // max_token_in terlalu kecil -> slippage
    let ix = add_mass_ix(&env, &caller.pubkey(), MIN_MASS_SOL, 1);
    assert_err(send(&mut env.svm, &[ix], &[&caller]), "SlippageExceeded");

    // 3 SOL butuh ~600.000 token > cap 5% dari 10 jt = 500.000 token
    let ix = add_mass_ix(&env, &caller.pubkey(), 3_000_000_000, u64::MAX);
    assert_err(send(&mut env.svm, &[ix], &[&caller]), "MassCapExceeded");

    let after = read_pool(&env.svm, &env.pool);
    assert_eq!(after.sol_reserve, before.sol_reserve);
    assert_eq!(after.token_reserve, before.token_reserve);
    assert_eq!(after.total_mass_sol, 0);
}

#[test]
fn fake_vault_is_rejected() {
    let mut env = seeded_env();
    let trader = Keypair::new();
    env.svm.airdrop(&trader.pubkey(), 20_000_000_000).unwrap();
    let trader_token = create_token_account(&mut env.svm, &trader, &env.mint, &trader.pubkey());

    let fake_sol_vault = Pubkey::new_unique();
    let mut accounts = inertia_mass::accounts::Swap {
        trader: trader.pubkey(),
        pool: env.pool,
        mint: env.mint,
        trader_token_account: trader_token,
        token_vault: env.token_vault,
        vault_authority: env.vault_authority,
        sol_vault: env.sol_vault,
        fee_vault: env.fee_vault,
        token_program: token_program_id(),
        system_program: system_program_id(),
    }
    .to_account_metas(None);
    for meta in accounts.iter_mut() {
        if meta.pubkey == env.sol_vault {
            meta.pubkey = fake_sol_vault;
        }
    }
    let ix = Instruction::new_with_bytes(
        inertia_mass::id(),
        &inertia_mass::instruction::Swap {
            direction: Direction::Buy,
            amount_in: 1_000_000_000,
            min_amount_out: 0,
            deadline: 0,
        }
        .data(),
        accounts,
    );
    assert_err_any(
        send(&mut env.svm, &[ix], &[&trader]),
        &["InvalidVault", "ConstraintSeeds"],
    );
}

#[test]
fn donation_to_sol_vault_does_not_move_price() {
    let mut env = seeded_env();
    let before = read_pool(&env.svm, &env.pool);
    let ix = system_transfer_ix(&env.payer.pubkey(), &env.sol_vault, 1_000_000_000);
    send_ok(&mut env.svm, &[ix], &[&env.payer]);

    let after = read_pool(&env.svm, &env.pool);
    assert_eq!(
        after.price_scaled().unwrap(),
        before.price_scaled().unwrap()
    );
    assert_eq!(after.sol_reserve, before.sol_reserve);
    assert!(
        env.svm.get_balance(&env.sol_vault).unwrap() >= after.sol_reserve + RENT_EXEMPT_MIN
    );
}

#[test]
fn sell_more_than_balance_fails() {
    let mut env = seeded_env();
    let trader = Keypair::new();
    env.svm.airdrop(&trader.pubkey(), 20_000_000_000).unwrap();
    let trader_token = create_token_account(&mut env.svm, &trader, &env.mint, &trader.pubkey());

    // Beli kecil dulu supaya trader punya token.
    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Buy,
        1_000_000_000,
        0,
        0,
    );
    send_ok(&mut env.svm, &[ix], &[&trader]);
    let owned = token_balance(&env.svm, &trader_token);
    assert!(owned > 0);

    // Jual melebihi saldo: gagal di token program, bukan panic.
    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Sell,
        owned + 1,
        0,
        0,
    );
    assert!(send(&mut env.svm, &[ix], &[&trader]).is_err());

    let pool = read_pool(&env.svm, &env.pool);
    assert_eq!(token_balance(&env.svm, &trader_token), owned);
    assert!(pool.token_reserve < POOL_TOKENS);
}

#[test]
fn sell_slippage_and_sell_guards() {
    let mut env = seeded_env();
    let trader = Keypair::new();
    env.svm.airdrop(&trader.pubkey(), 20_000_000_000).unwrap();
    let trader_token = create_token_account(&mut env.svm, &trader, &env.mint, &trader.pubkey());

    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Buy,
        2_000_000_000,
        0,
        0,
    );
    send_ok(&mut env.svm, &[ix], &[&trader]);
    let owned = token_balance(&env.svm, &trader_token);

    // min_out tidak mungkin tercapai.
    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Sell,
        owned,
        u64::MAX,
        0,
    );
    assert_err(send(&mut env.svm, &[ix], &[&trader]), "SlippageExceeded");

    // amount_in = 0.
    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Sell,
        0,
        0,
        0,
    );
    assert_err(send(&mut env.svm, &[ix], &[&trader]), "ZeroAmount");
}

#[test]
fn revoke_mint_authority_then_swap_still_works() {
    let mut env = seeded_env();
    // SetAuthority(MintTokens, None) = tag 6, authority_type 0, COption None.
    let ix = token_ix(
        vec![
            AccountMeta::new(env.mint, false),
            AccountMeta::new_readonly(env.payer.pubkey(), true),
        ],
        vec![6u8, 0u8, 0u8],
    );
    send_ok(&mut env.svm, &[ix], &[&env.payer]);

    let trader = Keypair::new();
    env.svm.airdrop(&trader.pubkey(), 10_000_000_000).unwrap();
    let trader_token = create_token_account(&mut env.svm, &trader, &env.mint, &trader.pubkey());
    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Buy,
        1_000_000_000,
        0,
        0,
    );
    send_ok(&mut env.svm, &[ix], &[&trader]);
    assert!(token_balance(&env.svm, &trader_token) > 0);
}

/// Fuzz matematika murni (tanpa SVM) — menutup matrix §13 nomor 23.
#[test]
fn fuzz_math_10000_iterations() {
    let mut seed = 0x9E37_79B9_7F4A_7C15u64;
    let mut next = || {
        seed ^= seed << 13;
        seed ^= seed >> 7;
        seed ^= seed << 17;
        seed
    };

    let mut token = POOL_TOKENS;
    let mut sol = POOL_SOL;
    let mut worst_gain_ppm = 0u128;

    for i in 0..10_000u64 {
        let direction = next() % 2;
        let k_before = token as u128 * sol as u128;

        if direction == 0 {
            // beli: 1 lamport .. 2 SOL
            let amount_in = 1 + next() % 2_000_000_000;
            let q = inertia_mass::math::quote_buy(token, sol, FEE_BPS, amount_in).unwrap();
            assert!(q.out > 0 && q.out <= token);
            token -= q.out;
            sol += q.net_in;
        } else {
            // jual: maksimal 2% dari token reserve
            let max_in = token / 50;
            if max_in == 0 {
                continue;
            }
            let amount_in = 1 + next() % max_in;
            let q = inertia_mass::math::quote_sell(token, sol, FEE_BPS, amount_in).unwrap();
            assert!(q.gross <= sol && q.net > 0);
            token += amount_in;
            sol -= q.gross;
        }

        let k_after = token as u128 * sol as u128;
        // Pembulatan floor pada output selalu menyisakan nilai di pool: `k`
        // tidak boleh turun, dan kenaikannya hanya sisa pembulatan (< 1 ppm).
        assert!(k_after >= k_before, "iter {i}: k turun");
        let gain_ppm = (k_after - k_before) * 1_000_000 / k_before;
        if gain_ppm > worst_gain_ppm {
            worst_gain_ppm = gain_ppm;
        }
        assert!(gain_ppm <= 1, "iter {i}: k naik {gain_ppm} ppm");
        assert!(token > 0 && sol > 0);
    }

    // add_mass: token_needed selalu ceil dan tidak pernah 0 untuk SOL > 0.
    for _ in 0..1_000 {
        let amount_sol = 1 + next() % 5_000_000_000;
        let needed =
            inertia_mass::math::mass_token_needed(amount_sol, POOL_TOKENS, POOL_SOL).unwrap();
        let exact = amount_sol as u128 * POOL_TOKENS as u128 / POOL_SOL as u128;
        assert!(needed as u128 >= exact);
        assert!((needed as u128 - exact) < 2);
    }
}

// ---------------------------------------------------------------- event replay
//
// Matrix §13 #24: buktikan event yang di-emit bisa di-replay jadi baris
// Activity/candle di frontend. Parser di sini meniru klien: ambil log
// `Program data: <base64>`, potong discriminator 8 byte, deserialisasi Borsh.
#[test]
fn events_replay_like_frontend_parser() {
    // 1. Discriminator harus sama dengan hitungan klien.
    assert_eq!(PoolInitialized::DISCRIMINATOR, &event_disc("PoolInitialized")[..]);
    assert_eq!(PoolSeeded::DISCRIMINATOR, &event_disc("PoolSeeded")[..]);
    assert_eq!(SwapEvent::DISCRIMINATOR, &event_disc("SwapEvent")[..]);
    assert_eq!(MassAdded::DISCRIMINATOR, &event_disc("MassAdded")[..]);

    let mut env = init_env(TOKEN_DECIMALS, DEVNET_INTERVAL);
    let clock: Clock = env.svm.get_sysvar();

    // 2. PoolInitialized.
    let init_ev: PoolInitialized = decode_event(&env.init_logs, "PoolInitialized");
    assert_eq!(init_ev.pool, env.pool);
    assert_eq!(init_ev.mint, env.mint);
    assert_eq!(init_ev.authority, env.payer.pubkey());
    assert_eq!(init_ev.fee_bps, FEE_BPS);
    assert_eq!(init_ev.mass_interval, DEVNET_INTERVAL);
    assert_eq!(init_ev.timestamp, clock.unix_timestamp);

    // 3. PoolSeeded -> candle pembuka (harga = P0).
    let meta = seed(&mut env, POOL_TOKENS, POOL_SOL).expect("seed sukses");
    let seeded: PoolSeeded = decode_event(&meta.logs, "PoolSeeded");
    let pool = read_pool(&env.svm, &env.pool);
    assert_eq!(seeded.pool, env.pool);
    assert_eq!(seeded.token_amount, POOL_TOKENS);
    assert_eq!(seeded.sol_amount, POOL_SOL);
    assert_eq!(seeded.price_scaled, pool.price_scaled().unwrap());
    assert_eq!(seeded.launch_slot, clock.slot);
    assert_eq!(seeded.timestamp, pool.launch_ts);

    let (mint, mass_reserve_vault) = (env.mint, env.mass_reserve_vault);
    mint_to(&mut env.svm, &env.payer, &mint, &mass_reserve_vault, RESERVE_TOKENS);

    let trader = Keypair::new();
    env.svm.airdrop(&trader.pubkey(), 30_000_000_000).unwrap();
    let trader_token = create_token_account(&mut env.svm, &trader, &env.mint, &trader.pubkey());

    // 4. Buy: baris Activity beli.
    let amount_in = 2_500_000_000u64;
    let (fee, net, out) = quote_buy(POOL_TOKENS, POOL_SOL, amount_in);
    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Buy,
        amount_in,
        out,
        0,
    );
    let meta = send_ok_meta(&mut env.svm, &[ix], &[&trader]);
    let buy: SwapEvent = decode_event(&meta.logs, "SwapEvent");
    let after_buy = read_pool(&env.svm, &env.pool);

    assert_eq!(buy.pool, env.pool);
    assert_eq!(buy.wallet, trader.pubkey());
    assert_eq!(buy.direction, 0);
    assert_eq!(buy.sol_user, amount_in, "SOL yang dibayar user");
    assert_eq!(buy.fee, fee);
    assert_eq!(buy.sol_amount, net, "SOL netto yang masuk reserve");
    assert_eq!(buy.token_amount, out);
    assert_eq!(buy.price_after, after_buy.price_scaled().unwrap());
    assert_eq!(buy.reserve_token, after_buy.token_reserve);
    assert_eq!(buy.reserve_sol, after_buy.sol_reserve);
    assert_eq!(buy.timestamp, clock.unix_timestamp);

    // Harga rata-rata (dipakai frontend) di antara harga awal dan harga akhir.
    let avg_buy = avg_price_scaled(buy.sol_user, buy.token_amount);
    assert!(avg_buy > seeded.price_scaled as u128, "avg beli {avg_buy}");
    assert!(avg_buy < buy.price_after as u128, "avg beli {avg_buy}");

    // 5. Sell: baris Activity jual.
    let bought = token_balance(&env.svm, &trader_token);
    assert_eq!(bought, out);
    let (gross, sell_fee, net_out) =
        quote_sell(after_buy.token_reserve, after_buy.sol_reserve, bought);
    let ix = swap_ix(
        &env,
        &trader.pubkey(),
        &trader_token,
        Direction::Sell,
        bought,
        net_out,
        0,
    );
    let meta = send_ok_meta(&mut env.svm, &[ix], &[&trader]);
    let sell: SwapEvent = decode_event(&meta.logs, "SwapEvent");
    let after_sell = read_pool(&env.svm, &env.pool);

    assert_eq!(sell.direction, 1);
    assert_eq!(sell.sol_user, net_out, "SOL yang diterima user");
    assert_eq!(sell.fee, sell_fee);
    assert_eq!(sell.sol_amount, gross, "SOL bruto yang keluar reserve");
    assert_eq!(sell.token_amount, bought);
    assert_eq!(sell.price_after, after_sell.price_scaled().unwrap());
    assert_eq!(sell.reserve_token, after_sell.token_reserve);
    assert_eq!(sell.reserve_sol, after_sell.sol_reserve);
    assert_eq!(sell.timestamp, clock.unix_timestamp);

    let avg_sell = avg_price_scaled(sell.sol_user, sell.token_amount);
    assert!(avg_sell > sell.price_after as u128, "avg jual {avg_sell}");
    assert!(avg_sell < buy.price_after as u128, "avg jual {avg_sell}");

    // 6. MassAdded: baris "massa masuk" untuk Activity.
    fund_fee_vault(&mut env, MIN_MASS_SOL);
    advance_clock(&mut env, DEVNET_INTERVAL);
    let caller = Keypair::new();
    env.svm.airdrop(&caller.pubkey(), 10_000_000_000).unwrap();

    let expected_needed =
        inertia_mass::math::mass_token_needed(MIN_MASS_SOL, after_sell.token_reserve, after_sell.sol_reserve)
            .unwrap();
    let ix = add_mass_ix(&env, &caller.pubkey(), MIN_MASS_SOL, u64::MAX);
    let meta = send_ok_meta(&mut env.svm, &[ix], &[&caller]);
    let mass: MassAdded = decode_event(&meta.logs, "MassAdded");
    let after_mass = read_pool(&env.svm, &env.pool);

    assert_eq!(mass.pool, env.pool);
    assert_eq!(mass.caller, caller.pubkey());
    assert_eq!(mass.sol_amount, MIN_MASS_SOL);
    assert_eq!(mass.token_amount, expected_needed);
    assert_eq!(mass.reserve_token, after_sell.token_reserve + expected_needed);
    assert_eq!(mass.reserve_sol, after_sell.sol_reserve + MIN_MASS_SOL);
    assert_eq!(mass.price_after, after_mass.price_scaled().unwrap());
    assert_eq!(mass.total_mass_sol, MIN_MASS_SOL);
    assert_eq!(mass.total_mass_token, expected_needed);
    assert_eq!(mass.timestamp, after_mass.last_mass_ts);
    assert_eq!(
        token_balance(&env.svm, &env.token_vault),
        after_mass.token_reserve,
        "saldo token vault = reserve di state"
    );
}
