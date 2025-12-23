// Mock Database Service
// Using a simple in-memory store for demo purposes. 
// In a real app, this would be a database connection (Postgres/Prisma).

export type Activity = {
    id: string
    type: "LOGIN" | "LOAN_APPLICATION" | "SCORE_UPDATE" | "DOCUMENT_UPLOAD"
    description: string
    timestamp: Date
}

export type Document = {
    id: string
    name: string
    type: string
    status: "pending" | "approved" | "rejected" | "need_more_info"
    url: string
    uploadedAt: Date
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

export type Transaction = {
    id: string
    date: Date
    description: string
    amount: number
    type: "credit" | "debit"
    category: "Utility" | "Telco" | "Rent" | "Salary" | "Other"
    status: "Paid" | "Pending" | "Failed"
}

export type User = {
    id: string
    phone: string
    cnic: string
    income: number
    password: string // In real app, this would be hashed
    name?: string
    email?: string

    // Profile Data (US-03)
    dependents?: number
    householdType?: "owned" | "rented" | "family"

    // Scoring Data (US-06)
    score?: number
    telcoScore?: number
    utilityScore?: number
    riskLevel?: "Low" | "Medium" | "High"

    // Mock History Data (US-04, US-05)
    telcoHistory?: {
        averageBill: number
        latePayments: number
        dataUsageGB: number
        tenureYears: number
    }
    utilityHistory?: {
        averageBill: number
        latePayments: number
        provider: string
    }

    transactionHistory: Transaction[]
    documents: Document[]
    history: Activity[]
}

class MockDB {
    private users: User[] = []
    private loans: Loan[] = []

    constructor() {
        // Seed some data
        const seedUsers = [
            { name: "Nabeegh", phone: "03001234567", cnic: "12345-1234567-1", pass: "12345678" },
            { name: "Ahad", phone: "03007654321", cnic: "54321-7654321-1", pass: "12345678" },
            { name: "Admin", phone: "admin", cnic: "00000-0000000-0", pass: "123456" }
        ];

        seedUsers.forEach(seed => {
            const user: User = {
                id: Math.random().toString(36).substr(2, 9),
                phone: seed.phone,
                cnic: seed.cnic,
                income: 85000,
                password: seed.pass,
                name: seed.name,
                score: 750,
                documents: [],
                transactionHistory: [],
                history: [
                    { id: "1", type: "LOGIN", description: "Account created", timestamp: new Date() }
                ]
            };
            this.generateRandomHistory(user); // Pre-fill history

            // Add mock doc for Ahad/Nabeegh
            user.documents.push({
                id: Math.random().toString(36).substr(2, 9),
                name: "Salary Slip.pdf",
                type: "application/pdf",
                status: "pending",
                url: "#",
                uploadedAt: new Date()
            });

            this.users.push(user);
        });

        // 1. Specific Request: Ahad with 600k loan seeded for demo
        const ahad = this.users.find(u => u.name === "Ahad");
        if (ahad) {
            this.createLoan(ahad.id, 600000, "Property_Docs.pdf");
        }

        // 2. Mock Loans for Random Users
        const names = ["Ali", "Bilal", "Sara", "Umer", "Hina", "Zain"];
        names.forEach(name => {
            const user: User = {
                id: Math.random().toString(36).substr(2, 9),
                phone: `0300${Math.floor(Math.random() * 10000000)}`,
                cnic: `${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 1000000)}-1`,
                income: Math.floor(Math.random() * 100000) + 30000,
                password: "password",
                name: name,
                score: Math.floor(Math.random() * 400) + 400,
                documents: [{
                    id: Math.random().toString(36).substr(2, 9),
                    name: "Bank_Statement.pdf",
                    type: "application/pdf",
                    status: "pending",
                    url: "#",
                    uploadedAt: new Date()
                }],
                transactionHistory: [],
                history: []
            };
            this.generateRandomHistory(user);
            this.users.push(user);

            this.createLoan(user.id, Math.floor(Math.random() * 400000) + 100000, "Bank_Statement.pdf");
        });
    }

    generateRandomHistory(user: User) {
        const transactions: Transaction[] = [];
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const providers = ["LESCO", "SNGPL", "PTCL", "Jazz", "Ufone", "Zong"];

        // Generate 20 random transactions over the last year
        for (let i = 0; i < 20; i++) {
            const isUtility = Math.random() > 0.5;
            const provider = providers[Math.floor(Math.random() * providers.length)];
            const month = months[Math.floor(Math.random() * months.length)];
            const year = 2025;

            transactions.push({
                id: Math.random().toString(36).substr(2, 9),
                date: new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
                description: isUtility
                    ? `${provider} Bill ${month} ${year}`
                    : `${provider} Mobile Load / Bundle`,
                amount: isUtility ? Math.floor(Math.random() * 15000) + 2000 : Math.floor(Math.random() * 1000) + 100,
                type: "debit",
                category: isUtility ? "Utility" : "Telco",
                status: "Paid"
            });
        }

        // Sort by date desc
        user.transactionHistory = transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    async createUser(data: Omit<User, "id" | "history" | "documents" | "transactionHistory">): Promise<User> {
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
            documents: [],
            transactionHistory: [],
            history: [{
                id: Math.random().toString(36).substr(2, 9),
                type: "LOGIN",
                description: "Account created",
                timestamp: new Date()
            }]
        }

        // Generate initial mock data if not provided
        this.generateRandomHistory(newUser);

        this.users.push(newUser)
        return newUser
    }

    async authenticateUser(phone: string, password: string): Promise<User> {
        await new Promise(resolve => setTimeout(resolve, 500))
        // Simple check
        // Allow login by name (case-insensitive) or phone
        const user = this.users.find(u => (u.phone === phone || u.name?.toLowerCase() === phone.toLowerCase()) && u.password === password)

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

    // US-03: Profile Setup
    async updateProfile(userId: string, data: Partial<User>): Promise<User> {
        await new Promise(resolve => setTimeout(resolve, 500))
        const user = this.users.find(u => u.id === userId)
        if (!user) throw new Error("User not found")

        Object.assign(user, data)

        // If profile is complete enough, generate mock data and calculate score
        if (user.income && user.dependents !== undefined && user.householdType) {
            await this.generateMockData(userId);
            await this.calculateCreditScore(userId);
        }

        return user
    }

    // US-04 & US-05: Mock Data Generation
    async generateMockData(userId: string): Promise<void> {
        const user = this.users.find(u => u.id === userId)
        if (!user) return

        // Generate Telco History
        user.telcoHistory = {
            averageBill: Math.floor(Math.random() * 3000) + 500, // 500 - 3500
            latePayments: Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0, // 20% chance of late payments
            dataUsageGB: Math.floor(Math.random() * 50) + 10,
            tenureYears: Math.floor(Math.random() * 5) + 1
        }

        // Generate Utility History
        user.utilityHistory = {
            averageBill: Math.floor(Math.random() * 15000) + 2000,
            latePayments: Math.random() > 0.9 ? Math.floor(Math.random() * 3) : 0, // 10% chance of late payments
            provider: ["LESCO", "K-Electric", "IESCO"][Math.floor(Math.random() * 3)]
        }

        user.history.unshift({
            id: Math.random().toString(36).substr(2, 9),
            type: "SCORE_UPDATE",
            description: `Retrieved external financial data`,
            timestamp: new Date()
        })
    }

    // US-06: Credit Score Calculation
    async calculateCreditScore(userId: string): Promise<User> {
        const user = this.users.find(u => u.id === userId)
        if (!user) throw new Error("User not found")

        let baseScore = 600;

        // 1. Income Impact (+0 to +100)
        if (user.income > 100000) baseScore += 100;
        else if (user.income > 50000) baseScore += 50;
        else baseScore += 20;

        // 2. Telco Impact (+/- 50)
        if (user.telcoHistory) {
            if (user.telcoHistory.latePayments === 0) baseScore += 30;
            else baseScore -= (user.telcoHistory.latePayments * 10);

            if (user.telcoHistory.tenureYears > 3) baseScore += 20;
        }

        // 3. Utility Impact (+/- 50)
        if (user.utilityHistory) {
            if (user.utilityHistory.latePayments === 0) baseScore += 50;
            else baseScore -= (user.utilityHistory.latePayments * 20);
        }

        // 4. Dependents Impact (Slight negative for high dependents with low income)
        if (user.dependents && user.dependents > 3 && user.income < 50000) {
            baseScore -= 20;
        }

        // Cap score 300-850
        user.score = Math.max(300, Math.min(850, baseScore));

        // Determine Risk Level
        if (user.score >= 750) user.riskLevel = "Low";
        else if (user.score >= 650) user.riskLevel = "Medium";
        else user.riskLevel = "High";

        user.history.unshift({
            id: Math.random().toString(36).substr(2, 9),
            type: "SCORE_UPDATE",
            description: `Credit score updated to ${user.score}`,
            timestamp: new Date()
        })

        return user;
    }

    // US-11: Document Upload
    async uploadDocument(userId: string, file: { name: string, type: string, url: string }): Promise<Document> {
        await new Promise(resolve => setTimeout(resolve, 500))
        const user = this.users.find(u => u.id === userId)
        if (!user) throw new Error("User not found")

        // Check file type (mock)
        const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!validTypes.includes(file.type)) {
            // In a real scenario, this check might happen before calling db
            // But valid to double check
        }

        const newDoc: Document = {
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.type,
            status: "pending",
            url: file.url, // In real app, this is S3/Blob URL
            uploadedAt: new Date()
        }

        user.documents.push(newDoc);

        user.history.unshift({
            id: Math.random().toString(36).substr(2, 9),
            type: "DOCUMENT_UPLOAD",
            description: `Uploaded document: ${file.name}`,
            timestamp: new Date()
        })

        return newDoc;
    }

    // US-13: Admin Review
    async getAllDocuments(): Promise<{ user: User, document: Document }[]> {
        await new Promise(resolve => setTimeout(resolve, 500))
        let allDocs: { user: User, document: Document }[] = [];

        this.users.forEach(user => {
            user.documents.forEach(doc => {
                allDocs.push({ user, document: doc });
            })
        })

        return allDocs.sort((a, b) => b.document.uploadedAt.getTime() - a.document.uploadedAt.getTime());
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

    async updateDocumentStatus(userId: string, docId: string, status: "approved" | "rejected" | "need_more_info"): Promise<Document> {
        await new Promise(resolve => setTimeout(resolve, 500))
        const user = this.users.find(u => u.id === userId)
        if (!user) throw new Error("User not found")

        const doc = user.documents.find(d => d.id === docId);
        if (!doc) throw new Error("Document not found");

        doc.status = status;
        return doc;
    }

    async getUser(userId: string): Promise<User | undefined> {
        return this.users.find(u => u.id === userId)
    }
}

// Singleton instance
export const db = new MockDB()
