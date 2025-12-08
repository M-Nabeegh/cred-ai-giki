// Mock Database Service
// Using a simple in-memory store for demo purposes. 
// In a real app, this would be a database connection (Postgres/Prisma).

export type User = {
    id: string
    phone: string
    cnic: string
    income: number
    password: string // In real app, this would be hashed
    name?: string
    score?: number
    history: Activity[]
}

export type Activity = {
    id: string
    type: "LOGIN" | "LOAN_APPLICATION" | "SCORE_UPDATE" | "DOCUMENT_UPLOAD"
    description: string
    timestamp: Date
}

export type Loan = {
    id: string
    userId: string
    userName: string
    amount: number
    status: "pending" | "approved" | "rejected"
    document?: string
    date: Date
}

class MockDB {
    private users: User[] = []
    private loans: Loan[] = []

    constructor() {
        // Seed some data
        this.users.push({
            id: "1",
            phone: "03001234567",
            cnic: "12345-1234567-1",
            income: 50000,
            password: "password123",
            name: "Demo User",
            score: 720,
            history: [
                { id: "1", type: "LOGIN", description: "Logged in successfully", timestamp: new Date() }
            ]
        })
    }

    async createUser(data: Omit<User, "id" | "history">): Promise<User> {
        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500))

        // Check constraints
        if (this.users.find(u => u.phone === data.phone)) {
            throw new Error("Phone number already registered")
        }
        if (this.users.find(u => u.cnic === data.cnic)) {
            throw new Error("CNIC already registered")
        }

        const newUser: User = {
            ...data,
            id: Math.random().toString(36).substr(2, 9),
            history: [{
                id: Math.random().toString(36).substr(2, 9),
                type: "LOGIN",
                description: "Account created",
                timestamp: new Date()
            }]
        }
        this.users.push(newUser)
        return newUser
    }

    async authenticateUser(phone: string, password: string): Promise<User> {
        await new Promise(resolve => setTimeout(resolve, 500))
        const user = this.users.find(u => u.phone === phone && u.password === password)
        if (!user) {
            throw new Error("Invalid phone or password")
        }

        // Add login history
        user.history.unshift({
            id: Math.random().toString(36).substr(2, 9),
            type: "LOGIN",
            description: "Logged in",
            timestamp: new Date()
        })

        return user
    }

    async createLoan(userId: string, amount: number, document?: string): Promise<Loan> {
        await new Promise(resolve => setTimeout(resolve, 500))
        const user = this.users.find(u => u.id === userId)
        if (!user) throw new Error("User not found")

        const loan: Loan = {
            id: Math.random().toString(36).substr(2, 9),
            userId,
            userName: user.name || "Unknown",
            amount,
            status: amount > 500000 ? "pending" : "approved",
            document,
            date: new Date()
        }
        this.loans.push(loan)

        // Update user history
        user.history.unshift({
            id: Math.random().toString(36).substr(2, 9),
            type: "LOAN_APPLICATION",
            description: `Applied for loan of PKR ${amount.toLocaleString()}`,
            timestamp: new Date()
        })

        return loan
    }

    async getLoans(): Promise<Loan[]> {
        await new Promise(resolve => setTimeout(resolve, 500))
        return [...this.loans]
    }

    async updateLoanStatus(loanId: string, status: "approved" | "rejected"): Promise<Loan> {
        await new Promise(resolve => setTimeout(resolve, 500))
        const loan = this.loans.find(l => l.id === loanId)
        if (!loan) throw new Error("Loan not found")

        loan.status = status
        return loan
    }

    async getUser(userId: string): Promise<User | undefined> {
        return this.users.find(u => u.id === userId)
    }
}

// Singleton instance
export const db = new MockDB()
