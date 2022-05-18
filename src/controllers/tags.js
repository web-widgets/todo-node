import DB from "../db/index.js";

export const getTags = async (req, res, next) => {
  try {
    const tags = await DB.Tags.findAll();
    const values = tags.map((v) => v.name);
    res.send(values);
  } catch (err) {
    return next(err);
  }
};
