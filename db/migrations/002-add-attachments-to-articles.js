// Adds attachments column to existing articles table
export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn("articles", "attachments", {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
    });
  }
  
  // Rolls back the change
  export async function down(queryInterface) {
    await queryInterface.removeColumn("articles", "attachments");
  }
  