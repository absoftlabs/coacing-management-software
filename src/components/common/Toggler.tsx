import { IconMoonStars, IconSun } from '@tabler/icons-react'
import React from 'react'

function Toggler() {
    return (
        <div>
            <label className="swap swap-rotate">
                {/* this hidden checkbox controls the state */}
                <input type="checkbox" className="theme-controller" value="cupcake" />

                {/* sun icon */}
                <IconSun className="swap-on h-10 w-10 fill-current" />

                {/* moon icon */}
                <IconMoonStars className="swap-off h-10 w-10 fill-current" />
            </label>
        </div>
    )
}

export default Toggler