import {
  isJuwaExternalPlatform,
  juwaExternalAddUser,
  juwaExternalRecharge,
  juwaExternalWithdraw,
  juwaExternalGetUserBalance,
  sanitizeJuwaExternalAccount,
  getJuwaExternalConfig,
} from '@/lib/juwaExternal';
import { generateGamePassword } from '@/lib/fastapi';

export {
  isJuwaExternalPlatform,
  juwaExternalGetUserBalance,
};

export function buildJuwaAccountName(username, platformName) {
  const cfg = getJuwaExternalConfig(platformName);
  const prefix = cfg?.accountPrefix || 'jx';
  const sanitized = (username || 'user').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 8);
  const suffix = Math.floor(100 + Math.random() * 900);
  return sanitizeJuwaExternalAccount(`${prefix}_${sanitized}${suffix}`, prefix);
}

export async function juwaIntegrationRegister({ platformName, user, platform, userModel, UserGameAccount, GameTransaction, orderNo, generateGamePassword: genPass = generateGamePassword }) {
  const rawAccount = buildJuwaAccountName(user.username, platformName);
  const generatedPassword = genPass();

  const apiRes = await juwaExternalAddUser({
    platformName,
    account: rawAccount,
    password: generatedPassword,
  });

  if (apiRes.success) {
    await UserGameAccount.findOneAndUpdate(
      { user_id: user._id.toString(), platform_name: platform.name },
      {
        user_id: user._id.toString(),
        username: user.username,
        platform_id: platform._id.toString(),
        platform_name: platform.name,
        in_game_account_id: apiRes.userId,
        game_username: apiRes.accountName || rawAccount,
        game_password: generatedPassword,
        status: 'Active',
        updated_at: new Date(),
      },
      { upsert: true, new: true }
    );

    await GameTransaction.create({
      order_no: orderNo,
      user_id: user._id.toString(),
      username: user.username,
      type: 'Register',
      platform_name: platform.name,
      game_account: apiRes.accountName || rawAccount,
      game_username: apiRes.accountName || rawAccount,
      game_password: generatedPassword,
      amount: 0,
      status: 'Approved',
      api_dispatch_status: 'JuwaAPI',
      in_game_tx_id: `JUWA_ID_${apiRes.userId}`,
      wallet_balance_before: user.wallet_balance || 0,
      wallet_balance_after: user.wallet_balance || 0,
      admin_notes: `Auto-registered via Juwa External API (${platform.name})`,
      created_at: new Date(),
    });

    return {
      ok: true,
      auto: true,
      game_username: apiRes.accountName || rawAccount,
      game_password: generatedPassword,
    };
  }

  await GameTransaction.create({
    order_no: orderNo,
    user_id: user._id.toString(),
    username: user.username,
    type: 'Register',
    platform_name: platform.name,
    amount: 0,
    status: 'Pending',
    api_dispatch_status: 'Manual',
    failure_reason: apiRes.message,
    wallet_balance_before: user.wallet_balance || 0,
    wallet_balance_after: user.wallet_balance || 0,
    admin_notes: `Juwa API register failed: ${apiRes.message}`,
    created_at: new Date(),
  });

  return { ok: true, auto: false, message: apiRes.message };
}
