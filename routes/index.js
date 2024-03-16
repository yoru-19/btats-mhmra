const { Router } = require("express");

const routes = Router();

routes.use("/api/v1/users" , require("./user.route"));
routes.use("/api/v1/auth" , require("./auth.route"));
routes.use("/api/v1/category" , require("./category.route"));
routes.use("/api/v1/course" , require("./course.route"));
routes.use("/api/v1/coursemodule" , require("./module.route"));
routes.use("/api/v1/section" ,require("./section.route"));

module.exports = routes;
