
export type ThreadType = {
    // The identifier, which can be referenced in API endpoints.
    id: string
    // The Unix timestamp (in seconds) for when the thread was created.
    created_at: number
    metadata: Record<string, string>
}

export type MessageType = {
    // The identifier, which can be referenced in API endpoints.
    id?: string
    // The Unix timestamp (in seconds) for when the message was created.
    created_at?: number
    // The thread ID that this message belongs to.
    thread_id?: string
    // The entity that produced the message. Can be user or assistant.
    role: string
    // The content of the message
    content?: any
    // If applicable, the ID of the agent that authored this message.
    assistant_id?: string
    // The display name of the agent that produced this message.
    name?: string
    // The ID of the run that produced this message.
    run_id?: string
    metadata?: any
}
