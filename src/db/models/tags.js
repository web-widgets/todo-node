import { DataTypes } from "sequelize";

export default function initTag(instance) {
  return instance.define(
    "Tag",
    {
      name: {
        type: DataTypes.STRING,
      },
    },
    {
      tableName: "tags",
      createdAt: false,
      updatedAt: false,
    }
  );
}
