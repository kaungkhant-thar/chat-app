"use client";
import { useAuthStore } from "@web/store/auth";
import React from "react";
import { Button } from "../ui/button";
import Link from "next/link";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuthStore();
  return (
    <section className=" p-4 bg-white text-primary text shadow">
      <div className="container flex justify-between items-center">
        <Link href="/">
          <h1 className="text-2xl font-bold">Easy chat</h1>
        </Link>
        <nav>
          <ul className="flex">
            <li>
              <Button variant={"link"} asChild>
                <Link href="/">Home</Link>
              </Button>
            </li>
            {isAuthenticated ? (
              <>
                <li>
                  <Button variant={"link"} asChild>
                    <Link href="/profile">Profile</Link>
                  </Button>
                </li>
                <li>
                  <Button variant={"link"} onClick={logout}>
                    Logout
                  </Button>
                </li>
              </>
            ) : (
              <li>
                <Button variant={"link"} asChild>
                  <Link href="/login">Login</Link>
                </Button>
              </li>
            )}
          </ul>
        </nav>
      </div>
    </section>
  );
};

export default Navbar;
