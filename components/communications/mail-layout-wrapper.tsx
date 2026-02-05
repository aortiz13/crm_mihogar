'use client'

import dynamic from 'next/dynamic'
import { MailLayoutProps } from './mail-layout'

const MailLayout = dynamic(() => import('./mail-layout').then(m => m.MailLayout), { ssr: false })

export function MailLayoutWrapper(props: MailLayoutProps) {
    return (
        <MailLayout {...props} />
    )
}
