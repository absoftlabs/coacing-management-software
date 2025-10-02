import { IconSchool } from '@tabler/icons-react'
import React from 'react'

function StatisticsCard() {
    return (
        <div className='grid grid-cols-10 gap-5 justify-between items-center'>
            <div className="col-span-10 md:col-span-5 lg:col-span-2">
                <div className="flex justify-between items-center p-4 rounded-lg shadow-md bg-base-200">
                    <div className='text-base-content'>
                        <h4 className="font-semibold">Total Students</h4>
                        <p className='text-3xl font-bold'>150</p>
                        <small>Enrolled</small>
                    </div>
                    <div className='bg-primary text-primary-content p-2 rounded'><IconSchool/></div>
                </div>
            </div>
            <div className="col-span-10 md:col-span-5 lg:col-span-2">
                <div className="flex justify-between items-center p-4 rounded-lg shadow-md bg-base-200">
                    <div className='text-base-content'>
                        <h4 className="font-semibold">Present Today</h4>
                        <p className='text-3xl font-bold'>15</p>
                        <small>Students</small>
                    </div>
                    <div className='bg-secondary text-secondary-content p-2 rounded'><IconSchool/></div>
                </div>
            </div>
            <div className="col-span-10 md:col-span-5 lg:col-span-2">
                <div className="flex justify-between items-center p-4 rounded-lg shadow-md bg-base-200">
                    <div className='text-base-content'>
                        <h4 className="font-semibold">Collected Fees</h4>
                        <p className='text-3xl font-bold'>৳ 5000</p>
                        <small>Tution Fees</small>
                    </div>
                    <div className='bg-accent text-accent-content p-2 rounded'><IconSchool/></div>
                </div>
            </div>
            <div className="col-span-10 md:col-span-5 lg:col-span-2">
                <div className="flex justify-between items-center p-4 rounded-lg shadow-md bg-base-200">
                    <div className='text-base-content'>
                        <h4 className="font-semibold">Total Teachers</h4>
                        <p className='text-3xl font-bold'>10</p>
                        <small>Class 6-10</small>
                    </div>
                    <div className='bg-info text-info-content p-2 rounded'><IconSchool/></div>
                </div>
            </div>
            <div className="col-span-10 md:col-span-5 lg:col-span-2">
                <div className="flex justify-between items-center p-4 rounded-lg shadow-md bg-base-200">
                    <div className='text-base-content'>
                        <h4 className="font-semibold">SMS Balance</h4>
                        <p className='text-3xl font-bold'>৳ 1250</p>
                        <small>Left</small>
                    </div>
                    <div className='bg-warning text-warning-content p-2 rounded'><IconSchool/></div>
                </div>
            </div>

        </div>
    )
}

export default StatisticsCard