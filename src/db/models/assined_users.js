export default function initAssignedUsers(instance) {
  return instance.define(
    "AssignedUsers",
    {},
    {
      tableName: "assigned_users",
      createdAt: false,
      updatedAt: false,
    }
  );
}
