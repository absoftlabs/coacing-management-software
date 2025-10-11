import { IconAddressBook, IconAdjustmentsSearch, IconApps, IconBackpack, IconBrowserPlus, IconClipboardPlus, IconDashboard, IconGraph, IconHexagonLetterR, IconListDetails, IconMessage2, IconMessageChatbot, IconMessagePlus, IconSchool, IconUserPause, IconUserPlus } from '@tabler/icons-react'
import Link from 'next/link'
import React from 'react'

function Sidebar() {
    return (
        <div className="p-4 bg-base-200 w-full h-screen">
            <h2 className="text-lg font-bold px-4 bg-neutral p-2 rounded-md text-center uppercase text-primary">Admin Panel</h2>
            <ul className="menu w-full">
                <li><Link href={'/'}><IconDashboard/> Dashboard</Link></li>
                <li>
                    <details open>
                        <summary><IconSchool/> Student Management</summary>
                        <ul>
                            <li><Link href={'/add-student'}><IconUserPlus/> Add Student</Link></li>
                            <li><Link href={'/student-list'}><IconListDetails/> Student List</Link></li>
                            <li><Link href={'/suspended-students'}><IconUserPause/> Suspended Students</Link></li>
                            <li><Link href={'/students-report'}><IconGraph/> Student Report</Link></li>
                        </ul>
                    </details>
                </li>
                <li>
                    <details open>
                        <summary><IconBackpack/> Class Management</summary>
                        <ul>
                            <li><Link href={'/add-class'}><IconBrowserPlus/> Add Class</Link></li>
                            <li><Link href={'/class-list'}><IconAddressBook/> Class List</Link></li>
                            <li><Link href={'/classes-report'}><IconGraph/> Class Report</Link></li>
                        </ul>
                    </details>
                </li>
                <li><Link href={'/batch-list'}><IconBrowserPlus/> Batch</Link></li>
                <li>
                    <details open>
                        <summary><IconHexagonLetterR/> Result Management</summary>
                        <ul>
                            <li><Link href={'/add-result'}><IconClipboardPlus/> Add Result</Link></li>
                            <li><Link href={'/result-parameters'}><IconApps/> Result Parameters</Link></li>
                            <li><Link href={'/find-result'}><IconAdjustmentsSearch/> Find Result</Link></li>
                            <li><Link href={'/results-report'}><IconGraph/> Result Report</Link></li>
                        </ul>
                    </details>
                </li>
                <li>
                    <details open>
                        <summary><IconMessage2/> SMS Management</summary>
                        <ul>
                            <li><Link href={'/sms-templates'}><IconMessagePlus/> Add SMS Template</Link></li>
                            <li><Link href={'/sms-sender'}><IconMessageChatbot/> Custom SMS Sender</Link></li>
                            <li><Link href={'/sms-report'}><IconGraph/> SMS Report</Link></li>
                        </ul>
                    </details>
                </li>
            </ul>
        </div>
    )
}

export default Sidebar