
import { getTasks } from '@/lib/actions/tasks'
import { getContacts } from '@/lib/actions/contacts'
import { TasksLayout } from '@/components/tasks/tasks-layout'

export default async function TasksPage() {
    const [tasks, contacts] = await Promise.all([
        getTasks(),
        getContacts()
    ])

    return <TasksLayout initialTasks={tasks} contacts={contacts} />
}
