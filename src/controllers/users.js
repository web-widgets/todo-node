import DB from "../db/index.js";

export const get = async (req, res, next) => {
  try {
    const users = await DB.Users.findAll();
    res.send(users);
  } catch (err) {
    return next(err);
  }
};
