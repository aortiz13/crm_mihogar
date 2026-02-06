import { getTasks } from '@/lib/actions/tasks'
import { getContacts } from '@/lib/actions/contacts'
import { getCommunities } from '@/lib/actions/communities'
import { TasksLayout } from '@/components/tasks/tasks-layout'

export default async function TasksPage() {
    const [tasks, contacts, communities] = await Promise.all([
        getTasks(),
        getContacts(),
        getCommunities()
    ])

    return <TasksLayout initialTasks={tasks} contacts={contacts} communities={communities} />
}
