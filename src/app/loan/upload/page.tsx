"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { UploadCloud, File } from "lucide-react"

export default function DocumentUploadPage() {
    const router = useRouter()
    const [isUploading, setIsUploading] = useState(false)
    const [file, setFile] = useState<string | null>(null)

    const handleUpload = () => {
        setIsUploading(true)
        // Simulate upload
        setTimeout(() => {
            setIsUploading(false)
            router.push("/dashboard")
        }, 2000)
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl">
            <h1 className="text-3xl font-bold text-white mb-8">Document Verification</h1>
            <Card className="glass-card border-white/10">
                <CardHeader>
                    <CardTitle>Upload Documents</CardTitle>
                    <CardDescription>
                        Please upload your Salary Slip or Rent Agreement for manual verification.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-10 text-center hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setFile("salary_slip.pdf")}>
                        {file ? (
                            <div className="flex flex-col items-center">
                                <File className="w-12 h-12 text-brand mb-4" />
                                <p className="text-white font-medium">{file}</p>
                                <p className="text-sm text-emerald-500 mt-2">Ready to upload</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center">
                                <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                                <p className="text-gray-300 font-medium">Click to upload or drag and drop</p>
                                <p className="text-sm text-gray-500 mt-2">PDF, JPG or PNG (max 5MB)</p>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button
                        className="w-full"
                        variant="premium"
                        disabled={!file || isUploading}
                        onClick={handleUpload}
                    >
                        {isUploading ? "Uploading..." : "Submit Application"}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
