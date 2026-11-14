//! CLI Devnet INERTIA (`inertia_mass`).
//!
//! Perintah:
//!   status   --mint <PUBKEY>
//!   init     --mint <PUBKEY> [--fee-bps 30] [--interval 60]
//!   seed     --mint <PUBKEY> --sol 48 --token 9600000
//!   buy      --mint <PUBKEY> --sol 0.5 [--slippage-bps 100]
//!   sell     --mint <PUBKEY> --token 1000 [--slippage-bps 100]
//!   reserve  --mint <PUBKEY> --token 10000000
//!   add-mass --mint <PUBKEY> --sol 1 [--slippage-bps 100]
//!
//! Env: INERTIA_RPC (default https://api.devnet.solana.com),
//!      INERTIA_KEYPAIR (default ~/.config/solana/id.json).
//!
//! `--token` selalu dalam token utuh (6 desimal), `--sol` dalam SOL.

use {
    anchor_lang::{
        prelude::Pubkey,
        solana_program::instruction::{AccountMeta, Instruction},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    inertia_mass::{
        constants::PRICE_SCALE,
        math,
        state::{
            Direction, PoolState, FEE_VAULT_SEED, POOL_SEED, RESERVE_AUTH_SEED, SOL_VAULT_SEED,
            VAULT_AUTH_SEED,
        },
    },
    solana_rpc_client::rpc_client::RpcClient,
    solana_commitment_config::CommitmentConfig,
    solana_keypair::{read_keypair_file, Keypair},
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
    std::{
        collections::HashMap,
        error::Error,
        str::FromStr,
        time::{SystemTime, UNIX_EPOCH},
    },
};

type Res<T> = Result<T, Box<dyn Error>>;

const TOKEN_PROGRAM: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ATA_PROGRAM: &str = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const SYSTEM_PROGRAM: &str = "11111111111111111111111111111111";

const TOKEN_DECIMALS: u32 = 6;
const SOL_DECIMALS: u32 = 9;
const TOKEN_SCALE: u64 = 1_000_000;

fn main() {
    if let Err(err) = run() {
        eprintln!("gagal: {err}");
        std::process::exit(1);
    }
}

fn token_program() -> Pubkey {
    Pubkey::from_str(TOKEN_PROGRAM).unwrap()
}

fn ata_program() -> Pubkey {
    Pubkey::from_str(ATA_PROGRAM).unwrap()
}

fn system_program() -> Pubkey {
    Pubkey::from_str(SYSTEM_PROGRAM).unwrap()
}

fn ata(wallet: &Pubkey, mint: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[wallet.as_ref(), token_program().as_ref(), mint.as_ref()],
        &ata_program(),
    )
    .0
}

fn pda(seed: &[u8], pool: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[seed, pool.as_ref()], &inertia_mass::id()).0
}

struct Pdas {
    pool: Pubkey,
    vault_authority: Pubkey,
    reserve_authority: Pubkey,
    token_vault: Pubkey,
    mass_reserve_vault: Pubkey,
    sol_vault: Pubkey,
    fee_vault: Pubkey,
}

fn pdas(mint: &Pubkey) -> Pdas {
    let pool = Pubkey::find_program_address(&[POOL_SEED, mint.as_ref()], &inertia_mass::id()).0;
    let vault_authority = pda(VAULT_AUTH_SEED, &pool);
    let reserve_authority = pda(RESERVE_AUTH_SEED, &pool);
    Pdas {
        pool,
        vault_authority,
        reserve_authority,
        token_vault: ata(&vault_authority, mint),
        mass_reserve_vault: ata(&reserve_authority, mint),
        sol_vault: pda(SOL_VAULT_SEED, &pool),
        fee_vault: pda(FEE_VAULT_SEED, &pool),
    }
}

fn rpc() -> RpcClient {
    let url =
        std::env::var("INERTIA_RPC").unwrap_or_else(|_| "https://api.devnet.solana.com".to_string());
    RpcClient::new_with_commitment(url, CommitmentConfig::confirmed())
}

fn payer() -> Res<Keypair> {
    let home = std::env::var("HOME").unwrap_or_default();
    let path = std::env::var("INERTIA_KEYPAIR")
        .unwrap_or_else(|_| format!("{home}/.config/solana/keys/inrt-devnet-payer.json"));
    Ok(read_keypair_file(path)?)
}

const USAGE: &str = "\
inertia-devnet — CLI Devnet untuk program inertia_mass

pakai: inertia-devnet <subcommand> [--flag nilai ...]

subcommand:
  status     --mint <pubkey>
  init       --mint <pubkey> [--fee-bps 30] [--interval 60]
  seed       --mint <pubkey> --sol <SOL> --token <INRT>
  buy        --mint <pubkey> --sol <SOL> [--slippage-bps 50]
  sell       --mint <pubkey> --token <INRT> [--slippage-bps 50]
  reserve    --mint <pubkey> --token <INRT>     # isi Mass Reserve dari ATA payer
  add-mass   --mint <pubkey> --sol <SOL> [--slippage-bps 50]
  help

lingkungan:
  INERTIA_KEYPAIR  path keypair penandatangan (default ~/.config/solana/keys/inrt-devnet-payer.json)
  INERTIA_RPC      endpoint RPC (default https://api.devnet.solana.com)
";

fn send(client: &RpcClient, payer: &Keypair, ixs: &[Instruction]) -> Res<()> {
    let blockhash = client.get_latest_blockhash()?;
    let msg = Message::new_with_blockhash(ixs, Some(&payer.pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), &[payer])?;
    let sig = client.send_and_confirm_transaction(&tx)?;
    println!("ok: {sig}");
    Ok(())
}

/// Parse angka desimal ("48", "0.5") ke unit terkecil.
fn parse_units(input: &str, decimals: u32) -> Res<u64> {
    let (whole, frac) = input.split_once('.').unwrap_or((input, ""));
    if frac.len() > decimals as usize {
        return Err(format!("'{input}' maksimal {decimals} desimal").into());
    }
    let mut frac_padded = frac.to_string();
    while frac_padded.len() < decimals as usize {
        frac_padded.push('0');
    }
    let whole: u64 = if whole.is_empty() { 0 } else { whole.parse()? };
    let frac: u64 = if frac_padded.is_empty() {
        0
    } else {
        frac_padded.parse()?
    };
    let scale = 10u64.checked_pow(decimals).ok_or("desimal terlalu besar")?;
    whole
        .checked_mul(scale)
        .and_then(|v| v.checked_add(frac))
        .ok_or_else(|| format!("'{input}' terlalu besar").into())
}

fn flag(flags: &HashMap<String, String>, key: &str) -> Option<String> {
    flags.get(key).cloned()
}

fn need(flags: &HashMap<String, String>, key: &str) -> Res<String> {
    flag(flags, key).ok_or_else(|| format!("flag --{key} wajib").into())
}

fn mint_of(flags: &HashMap<String, String>) -> Res<Pubkey> {
    Ok(Pubkey::from_str(&need(flags, "mint")?)?)
}

fn slippage_bps(flags: &HashMap<String, String>) -> Res<u64> {
    match flag(flags, "slippage-bps") {
        Some(v) => {
            let bps: u64 = v.parse()?;
            if bps > 5_000 {
                return Err("slippage-bps maksimal 5000 (50%)".into());
            }
            Ok(bps)
        }
        None => Ok(100),
    }
}

fn now() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

/// Instruksi SPL `Transfer` (tag 3 + amount u64 LE) tanpa menarik crate spl-token.
fn spl_transfer_ix(
    source: Pubkey,
    destination: Pubkey,
    authority: Pubkey,
    amount: u64,
) -> Instruction {
    let mut data = Vec::with_capacity(9);
    data.push(3u8);
    data.extend_from_slice(&amount.to_le_bytes());
    Instruction {
        program_id: token_program(),
        accounts: vec![
            AccountMeta::new(source, false),
            AccountMeta::new(destination, false),
            AccountMeta::new_readonly(authority, true),
        ],
        data,
    }
}

fn read_pool(client: &RpcClient, pool: &Pubkey) -> Res<PoolState> {
    let account = client.get_account(pool)?;
    let mut data = account.data.as_slice();
    Ok(PoolState::try_deserialize(&mut data)?)
}

fn token_balance(client: &RpcClient, account: &Pubkey) -> Res<u64> {
    let acc = client.get_account(account)?;
    if acc.data.len() < 72 {
        return Err(format!("{account} bukan token account SPL").into());
    }
    Ok(u64::from_le_bytes(acc.data[64..72].try_into().unwrap()))
}

fn run() -> Res<()> {
    let raw: Vec<String> = std::env::args().skip(1).collect();
    if raw.is_empty() || raw.iter().any(|a| matches!(a.as_str(), "help" | "-h" | "--help")) {
        print!("{USAGE}");
        return Ok(());
    }

    let mut positional: Vec<String> = Vec::new();
    let mut flags: HashMap<String, String> = HashMap::new();
    let mut args = raw.into_iter();
    while let Some(arg) = args.next() {
        if let Some(key) = arg.strip_prefix("--") {
            let value = args.next().ok_or_else(|| format!("--{key} butuh nilai"))?;
            flags.insert(key.to_string(), value);
        } else {
            positional.push(arg);
        }
    }

    let cmd = positional
        .first()
        .ok_or("subcommand: status|init|seed|buy|sell|reserve|add-mass")?
        .as_str();
    let client = rpc();
    let payer = payer()?;
    println!("wallet : {}", payer.pubkey());
    println!("rpc    : {}", client.url());

    match cmd {
        "status" => cmd_status(&client, &flags),
        "init" => cmd_init(&client, &payer, &flags),
        "seed" => cmd_seed(&client, &payer, &flags),
        "buy" => cmd_buy(&client, &payer, &flags),
        "sell" => cmd_sell(&client, &payer, &flags),
        "reserve" => cmd_reserve(&client, &payer, &flags),
        "add-mass" => cmd_add_mass(&client, &payer, &flags),
        other => Err(format!("subcommand tidak dikenal: {other}").into()),
    }
}

fn cmd_init(client: &RpcClient, payer: &Keypair, flags: &HashMap<String, String>) -> Res<()> {
    let mint = mint_of(flags)?;
    let fee_bps: u16 = flag(flags, "fee-bps")
        .map(|v| v.parse())
        .transpose()?
        .unwrap_or(30);
    let interval: i64 = flag(flags, "interval")
        .map(|v| v.parse())
        .transpose()?
        .unwrap_or(60);
    let p = pdas(&mint);
    println!("mint   : {mint}");
    println!("pool   : {}", p.pool);
    println!("fee    : {fee_bps} bps");
    println!("interval: {interval} s");

    let ix = Instruction::new_with_bytes(
        inertia_mass::id(),
        &inertia_mass::instruction::InitializePool { fee_bps, mass_interval: interval }.data(),
        inertia_mass::accounts::InitializePool {
            authority: payer.pubkey(),
            mint,
            pool: p.pool,
            vault_authority: p.vault_authority,
            reserve_authority: p.reserve_authority,
            token_vault: p.token_vault,
            mass_reserve_vault: p.mass_reserve_vault,
            sol_vault: p.sol_vault,
            fee_vault: p.fee_vault,
            token_program: token_program(),
            associated_token_program: ata_program(),
            system_program: system_program(),
        }
        .to_account_metas(None),
    );
    send(client, payer, &[ix])
}

fn cmd_seed(client: &RpcClient, payer: &Keypair, flags: &HashMap<String, String>) -> Res<()> {
    let mint = mint_of(flags)?;
    let sol_amount = parse_units(&need(flags, "sol")?, SOL_DECIMALS)?;
    let token_amount = parse_units(&need(flags, "token")?, TOKEN_DECIMALS)?;
    let p = pdas(&mint);
    let authority_token_account = ata(&payer.pubkey(), &mint);

    println!(
        "seed   : {} token + {} lamports ({})",
        token_amount,
        sol_amount,
        fmt_sol(sol_amount)
    );
    println!("ata    : {authority_token_account}");

    let ix = Instruction::new_with_bytes(
        inertia_mass::id(),
        &inertia_mass::instruction::SeedLiquidity { token_amount, sol_amount }.data(),
        inertia_mass::accounts::SeedLiquidity {
            authority: payer.pubkey(),
            pool: p.pool,
            mint,
            authority_token_account,
            token_vault: p.token_vault,
            vault_authority: p.vault_authority,
            sol_vault: p.sol_vault,
            token_program: token_program(),
            system_program: system_program(),
        }
        .to_account_metas(None),
    );
    send(client, payer, &[ix])
}

fn cmd_buy(client: &RpcClient, payer: &Keypair, flags: &HashMap<String, String>) -> Res<()> {
    let mint = mint_of(flags)?;
    let amount_in = parse_units(&need(flags, "sol")?, SOL_DECIMALS)?;
    let p = pdas(&mint);
    let pool = read_pool(client, &p.pool)?;
    let quote = math::quote_buy(pool.token_reserve, pool.sol_reserve, pool.fee_bps, amount_in)
        .map_err(|e| format!("{e:?}"))?;
    let slip = slippage_bps(flags)? as u128;
    let min_out = u64::try_from(quote.out as u128 * (10_000 - slip) / 10_000)?;
    println!(
        "beli   : {} -> {} token (min {})",
        fmt_sol(amount_in),
        quote.out,
        min_out
    );

    let ix = Instruction::new_with_bytes(
        inertia_mass::id(),
        &inertia_mass::instruction::Swap {
            direction: Direction::Buy,
            amount_in,
            min_amount_out: min_out,
            deadline: now() + 120,
        }
        .data(),
        inertia_mass::accounts::Swap {
            trader: payer.pubkey(),
            pool: p.pool,
            mint,
            trader_token_account: ata(&payer.pubkey(), &mint),
            token_vault: p.token_vault,
            vault_authority: p.vault_authority,
            sol_vault: p.sol_vault,
            fee_vault: p.fee_vault,
            token_program: token_program(),
            system_program: system_program(),
        }
        .to_account_metas(None),
    );
    send(client, payer, &[ix])
}

fn cmd_sell(client: &RpcClient, payer: &Keypair, flags: &HashMap<String, String>) -> Res<()> {
    let mint = mint_of(flags)?;
    let amount_in = parse_units(&need(flags, "token")?, TOKEN_DECIMALS)?;
    let p = pdas(&mint);
    let pool = read_pool(client, &p.pool)?;
    let quote = math::quote_sell(pool.token_reserve, pool.sol_reserve, pool.fee_bps, amount_in)
        .map_err(|e| format!("{e:?}"))?;
    let slip = slippage_bps(flags)? as u128;
    let min_out = u64::try_from(quote.net as u128 * (10_000 - slip) / 10_000)?;
    println!(
        "jual   : {} token -> {} (min {})",
        amount_in,
        fmt_sol(quote.net),
        fmt_sol(min_out)
    );

    let ix = Instruction::new_with_bytes(
        inertia_mass::id(),
        &inertia_mass::instruction::Swap {
            direction: Direction::Sell,
            amount_in,
            min_amount_out: min_out,
            deadline: now() + 120,
        }
        .data(),
        inertia_mass::accounts::Swap {
            trader: payer.pubkey(),
            pool: p.pool,
            mint,
            trader_token_account: ata(&payer.pubkey(), &mint),
            token_vault: p.token_vault,
            vault_authority: p.vault_authority,
            sol_vault: p.sol_vault,
            fee_vault: p.fee_vault,
            token_program: token_program(),
            system_program: system_program(),
        }
        .to_account_metas(None),
    );
    send(client, payer, &[ix])
}

fn cmd_reserve(client: &RpcClient, payer: &Keypair, flags: &HashMap<String, String>) -> Res<()> {
    let mint = mint_of(flags)?;
    let amount = parse_units(&need(flags, "token")?, TOKEN_DECIMALS)?;
    let p = pdas(&mint);
    let source = ata(&payer.pubkey(), &mint);

    println!("reserve: {} token", fmt_token(amount));
    println!("dari   : {source}");
    println!("ke     : {} (Mass Reserve)", p.mass_reserve_vault);

    let ix = spl_transfer_ix(source, p.mass_reserve_vault, payer.pubkey(), amount);
    send(client, payer, &[ix])
}

fn cmd_add_mass(client: &RpcClient, payer: &Keypair, flags: &HashMap<String, String>) -> Res<()> {
    let mint = mint_of(flags)?;
    let amount_sol = parse_units(&need(flags, "sol")?, SOL_DECIMALS)?;
    let p = pdas(&mint);
    let pool = read_pool(client, &p.pool)?;
    let needed = math::mass_token_needed(amount_sol, pool.token_reserve, pool.sol_reserve)
        .map_err(|e| format!("{e:?}"))?;
    let slip = slippage_bps(flags)? as u128;
    let max_token_in = u64::try_from(needed as u128 * (10_000 + slip) / 10_000)?;
    println!(
        "massa  : {} -> butuh {} token (maks {})",
        fmt_sol(amount_sol),
        needed,
        max_token_in
    );

    let ix = Instruction::new_with_bytes(
        inertia_mass::id(),
        &inertia_mass::instruction::AddMass { amount_sol, max_token_in }.data(),
        inertia_mass::accounts::AddMass {
            caller: payer.pubkey(),
            pool: p.pool,
            mint,
            token_vault: p.token_vault,
            vault_authority: p.vault_authority,
            sol_vault: p.sol_vault,
            fee_vault: p.fee_vault,
            mass_reserve_vault: p.mass_reserve_vault,
            reserve_authority: p.reserve_authority,
            token_program: token_program(),
            system_program: system_program(),
        }
        .to_account_metas(None),
    );
    send(client, payer, &[ix])
}

fn cmd_status(client: &RpcClient, flags: &HashMap<String, String>) -> Res<()> {
    let mint = mint_of(flags)?;
    let p = pdas(&mint);
    let pool = read_pool(client, &p.pool)?;
    let price = pool.price_scaled().map_err(|e| format!("{e:?}"))?;
    let sol_vault = client.get_balance(&p.sol_vault).unwrap_or(0);
    let fee_vault = client.get_balance(&p.fee_vault).unwrap_or(0);

    println!("mint         : {mint}");
    println!("pool         : {}", p.pool);
    println!("authority    : {}", pool.authority);
    println!("seeded       : {}", pool.seeded);
    println!(
        "token_reserve: {} token",
        fmt_token(pool.token_reserve)
    );
    println!("sol_reserve  : {}", fmt_sol(pool.sol_reserve));
    println!(
        "price        : {} ({} SOL/token)",
        price,
        price as f64 / PRICE_SCALE as f64
    );
    println!("fee_bps      : {}", pool.fee_bps);
    println!("interval     : {} s", pool.mass_interval);
    println!("launch_slot  : {}", pool.launch_slot);
    println!("launch_ts    : {}", pool.launch_ts);
    println!("last_mass_ts : {}", pool.last_mass_ts);
    println!(
        "mass total   : {} / {} token",
        fmt_sol(pool.total_mass_sol),
        fmt_token(pool.total_mass_token)
    );
    println!("sol_vault    : {}", fmt_sol(sol_vault));
    println!("fee_vault    : {} @ {}", fmt_sol(fee_vault), p.fee_vault);
    println!(
        "token_vault  : {} token",
        fmt_token(token_balance(client, &p.token_vault).unwrap_or(0))
    );
    println!(
        "reserve vault: {} token @ {}",
        fmt_token(token_balance(client, &p.mass_reserve_vault).unwrap_or(0)),
        p.mass_reserve_vault
    );
    Ok(())
}

fn fmt_sol(lamports: u64) -> String {
    format!("{}.{:09} SOL", lamports / 1_000_000_000, lamports % 1_000_000_000)
}

fn fmt_token(raw: u64) -> String {
    format!("{}.{:06}", raw / TOKEN_SCALE, raw % TOKEN_SCALE)
}
