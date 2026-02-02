export async function up(queryInterface, Sequelize) {
    await queryInterface.addColumn("articles", "workspaceId", {
      type: Sequelize.INTEGER,
      allowNull: false,
    });
  
    await queryInterface.addConstraint("articles", {
      fields: ["workspaceId"],
      type: "foreign key",
      name: "articles_workspace_fk",
      references: {
        table: "workspaces",
        field: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
  }
  
  export async function down(queryInterface) {
    await queryInterface.removeConstraint("articles", "articles_workspace_fk");
    await queryInterface.removeColumn("articles", "workspaceId");
  }
  