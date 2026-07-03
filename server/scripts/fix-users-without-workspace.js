/**
 * Crea un workspace para usuarios existentes que se registraron antes del fix
 * de auto-provisioning (workspaces: [] en la BD).
 *
 * Uso:
 *   node scripts/fix-users-without-workspace.js         (dry-run, no escribe nada)
 *   node scripts/fix-users-without-workspace.js --apply (aplica los cambios)
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import User from '../src/modules/auth/user.model.js';
import { createWorkspace } from '../src/modules/workspaces/workspaces.service.js';

const apply = process.argv.includes('--apply');

function slugFor(name, userId) {
  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'workspace';
  return `${baseSlug}-${userId.toString().slice(-6)}`;
}

async function run() {
  await mongoose.connect(env.MONGODB_URI);

  const users = await User.find({
    $or: [{ workspaces: { $exists: false } }, { workspaces: { $size: 0 } }],
  });

  if (!users.length) {
    console.log('No hay usuarios sin workspace. Nada que hacer.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Usuarios sin workspace: ${users.length}${apply ? '' : ' (dry-run, usa --apply para aplicar)'}\n`);

  for (const user of users) {
    const slug = slugFor(user.name, user._id);
    console.log(` - ${user.email} -> workspace "${slug}"`);
    if (apply) {
      await createWorkspace({ name: `Workspace de ${user.name}`, slug }, user._id.toString());
    }
  }

  if (!apply) {
    console.log('\nDry-run completo. Vuelve a correr con --apply para crear los workspaces.');
  } else {
    console.log('\nListo. Workspaces creados.');
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
