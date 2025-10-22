'use client'
import React from 'react'
import ThemeToggle from './ThemeToggle'
import Image from 'next/image'
import { IconMenu2 } from '@tabler/icons-react';
import Drawer from './Drawer';

const ORG_LOGO = "https://i.ibb.co.com/cXwWBJCC/logo2.png";

function Header() {
    return (
        <div className="navbar bg-base-200 shadow-sm">
            <div className="flex-1">
                <div className="drawer-content md:hidden">
                    <Drawer />
                    <label htmlFor="my-drawer-1" className="btn drawer-button"><IconMenu2 /></label>
                </div>
                <a className="text-2xl hidden md:flex">Dashboard</a>
            </div>
            <div className="flex items-center justify-center gap-2">
                <ThemeToggle />

                <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                        <div className="w-10 rounded-full mask mask-circle">
                            <Image
                                alt="Tailwind CSS Navbar component"
                                src={ORG_LOGO}
                                layout="fill"
                                objectFit="cover"
                            />
                        </div>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                        <li>
                            <a className="justify-between">
                                Profile
                                <span className="badge">New</span>
                            </a>
                        </li>
                        <li><a>Settings</a></li>
                        <li><a>Logout</a></li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default Header