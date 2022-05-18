import { DataTypes } from "sequelize";

export default function initUser(instance) {
  return instance.define(
    "User",
    {
      label: {
        type: DataTypes.STRING,
      },
      avatar: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "users",
      createdAt: false,
      updatedAt: false,
    }
  );
}
