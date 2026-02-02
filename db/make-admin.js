import "dotenv/config";
import { sequelize } from "./config.js";
import { User } from "./models/user.js";

const email = process.argv[2];
if (!email) {
  console.log("Usage: node db/make-admin.js your@email.com");
  process.exit(1);
}

async function run() {
  try {
    await sequelize.authenticate();

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.log("User not found:", email);
      process.exit(1);
    }

    user.role = "admin";
    await user.save();

    console.log("Updated to admin:", { id: user.id, email: user.email, role: user.role });
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

run();
