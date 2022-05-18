import { DataTypes } from "sequelize";

export default function initProject(instance) {
  return instance.define(
    "Project",
    {
      label: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "projects",
      createdAt: false,
      updatedAt: false,
    }
  );
}
