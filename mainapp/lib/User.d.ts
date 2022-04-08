import React from "react";
import { Msg } from "./Admin";
import { Msg_, Mode } from "../src/Component/UsersTable";
declare function getUsers(_url: string): Promise<User[]>;
declare function putUsers(url: string, body: User[]): Promise<User[]>;
declare function saveUserBis(body: User, mode: Mode, updateModel: React.Dispatch<Msg>, updateLocal: React.Dispatch<Msg_>): Promise<void>;
declare function deleteUser(user: User, updateModel: React.Dispatch<Msg>): Promise<void>;
declare function restoreUsers(updateModel: React.Dispatch<Msg>, setModal: React.Dispatch<React.SetStateAction<boolean>>): () => void;
declare type User = {
    id: string;
    _type: string;
    login: string;
    password: string;
    groups: string[];
    source: string;
};
declare const newUser: (key: string) => User;
export { getUsers, newUser, saveUserBis as putUsersBis, restoreUsers, deleteUser, putUsers, User };
