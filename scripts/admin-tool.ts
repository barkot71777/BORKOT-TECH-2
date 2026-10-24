#!/usr/bin/env node
/**
 * Borkot Tech — Admin Account Maintenance & Recovery Tool
 *
 * Usage:
 *   npx tsx scripts/admin-tool.ts --fresh             Safely clear old admin accounts to start fresh setup
 *   npx tsx scripts/admin-tool.ts --set-password <pw> Directly set a new password on super admin
 *   npx tsx scripts/admin-tool.ts --status            Display database health & admin account status
 *   npx tsx scripts/admin-tool.ts --key               Display local server recovery key
 */

import { db } from '../src/server/db';

const args = process.argv.slice(2);

function printHelp() {
  console.log(`
======================================================
  Borkot Tech — Admin Account Maintenance Tool
======================================================
Commands:
  --fresh, --reset             Safely remove existing admin/staff accounts to
                               enable initial First-Admin Setup at /admin.
                               (Preserves 100% of products, orders & customers)

  --set-password <password>    Directly set a new password for the Super Admin.
                               Optionally supply --id=<adminId> or --email=<email>

  --status                     Show database statistics and admin setup status.

  --key                        Show the server-side recovery key.

  --help                       Show this help message.
======================================================
`);
}

async function main() {
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  // 1. Status Command
  if (args.includes('--status')) {
    const hasAdmin = db.hasSuperAdmin();
    const metrics = db.getDashboardMetrics();
    console.log('\n[Borkot Tech Database Status]');
    console.log(`  Super Admin Configured: ${hasAdmin ? 'YES' : 'NO (Fresh Setup Required)'}`);
    console.log(`  Total Customers:        ${metrics.totalCustomers}`);
    console.log(`  Total Products:         ${metrics.totalProducts}`);
    console.log(`  Total Orders:           ${metrics.totalOrders}`);
    console.log(`  Setup Status API:       ${hasAdmin ? 'Setup Disabled' : 'Setup Active at /admin'}\n`);
    return;
  }

  // 2. Key Command
  if (args.includes('--key')) {
    const envKey = process.env.ADMIN_RECOVERY_KEY || process.env.ADMIN_SETUP_SECRET;
    const localKey = db.getOrGenerateLocalRecoveryKey();
    console.log('\n[Borkot Tech Recovery Key]');
    if (envKey) {
      console.log(`  Configured Environment Key (ADMIN_RECOVERY_KEY): ${envKey}`);
    } else {
      console.log(`  Local Server Key (data/.admin_recovery_key):     ${localKey}`);
      console.log('  Tip: You can set ADMIN_RECOVERY_KEY in your hosting environment variables for persistent recovery.');
    }
    console.log('');
    return;
  }

  // 3. Fresh Setup Command
  if (args.includes('--fresh') || args.includes('--reset')) {
    console.log('\n[Initiating Fresh Admin Setup]');
    console.log('Creating explicit database backup...');
    const result = db.resetAdminAccountsForMaintenance();
    console.log(`  Backup saved to: ${result.backupPath}`);
    console.log(`  Old admin accounts removed: ${result.removedCount}`);
    console.log('  Customer accounts preserved: YES');
    console.log('  Products & catalog preserved: YES');
    console.log('  Orders & inventory preserved: YES');
    console.log('\n SUCCESS: Fresh First-Admin Setup is now enabled!');
    console.log('  Navigate to /admin in your browser to create your new administrator credentials.\n');
    return;
  }

  // 4. Set Password Command
  const setPasswordIdx = args.findIndex(a => a.startsWith('--set-password') || a === '-p');
  if (setPasswordIdx !== -1) {
    let newPassword = '';
    const argVal = args[setPasswordIdx];
    if (argVal.includes('=')) {
      newPassword = argVal.split('=')[1];
    } else if (args[setPasswordIdx + 1] && !args[setPasswordIdx + 1].startsWith('-')) {
      newPassword = args[setPasswordIdx + 1];
    }

    if (!newPassword || newPassword.length < 8) {
      console.error('\nERROR: A password of at least 8 characters is required.');
      console.error('Example: npx tsx scripts/admin-tool.ts --set-password=MySecurePassword2026!\n');
      process.exit(1);
    }

    const idArg = args.find(a => a.startsWith('--id='))?.split('=')[1];
    const emailArg = args.find(a => a.startsWith('--email='))?.split('=')[1];

    console.log('\n[Updating Admin Password]');
    const localKey = db.getOrGenerateLocalRecoveryKey();
    const envKey = process.env.ADMIN_RECOVERY_KEY || process.env.ADMIN_SETUP_SECRET || localKey;

    const res = db.recoverAdminAccess({
      recoveryKey: envKey,
      action: 'reset_password',
      adminId: idArg,
      email: emailArg,
      newPassword
    });

    console.log(`  ${res.message}`);
    if (res.user) {
      console.log(`  Admin ID: ${res.user.id}`);
      console.log(`  Email:    ${res.user.email}`);
      console.log(`  Name:     ${res.user.name}`);
    }
    console.log('\n SUCCESS: You can now log into /admin using these credentials.\n');
    return;
  }

  console.error('\nUnknown command. Run with --help for options.\n');
}

main().catch(err => {
  console.error('\nMaintenance Tool Error:', err.message || err);
  process.exit(1);
});
