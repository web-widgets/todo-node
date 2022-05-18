import { DataTypes } from "sequelize";

export default function initTask(instance) {
  return instance.define(
    "Task",
    {
      text: {
        type: DataTypes.TEXT,
      },
      checked: {
        type: DataTypes.BOOLEAN,
      },
      due_date: {
        type: DataTypes.DATE,
      },
      parent: {
        type: DataTypes.INTEGER,
        default: null,
      },
      project: {
        type: DataTypes.INTEGER,
        default: null,
      },
      index: {
        type: DataTypes.INTEGER,
      },
    },
    {
      tableName: "tasks",
      createdAt: false,
      updatedAt: false,
    }
  );
}
