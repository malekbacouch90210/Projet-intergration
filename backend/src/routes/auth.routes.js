import express from "express";
import {getUserDetails, resetPassword, searchUserByName, suspendUser, updateUserStatus, usersTab , updateSuspension} from "../controller/auth.controller.js";
const route = express.Router()

route.get("/usersTable",usersTab);
route.get("/getUser/:id",getUserDetails);
route.get("/usersTable/:name",searchUserByName)
route.patch("/updateStatus/:id",updateUserStatus)
route.patch("/usersTable/:id/reset_password",resetPassword)
route.post("/suspend", suspendUser);
route.patch("/updateSuspension/:id", updateSuspension);
// route.delete("/usersTable/:id",deleteUser)
export default route;