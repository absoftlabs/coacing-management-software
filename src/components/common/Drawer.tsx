import React from 'react'
import Sidebar from './Sidebar'

function Drawer() {
    return (
        <div>
            <div className="drawer">
                <input id="my-drawer-1" type="checkbox" className="drawer-toggle" />
                <div className="drawer-side">
                    <label htmlFor="my-drawer-1" aria-label="close sidebar" className="drawer-overlay"></label>
                    <ul className="menu bg-base-200 min-h-full w-80 p-4">
                        <Sidebar />
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default Drawer