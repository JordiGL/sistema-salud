import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ChartSkeleton() {
    return (
        <Card className="w-full relative overflow-hidden border-slate-100 shadow-sm rounded-3xl">
            <CardHeader className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6">
                {/* Export Buttons Skeleton */}
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>

                {/* Filters Skeleton */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center overflow-x-auto pb-1 sm:pb-0">
                    {/* Date Range Tabs */}
                    <Skeleton className="h-9 w-36 rounded-xl" />

                    {/* Time Tabs */}
                    <Skeleton className="h-9 w-36 rounded-xl" />

                    <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1"></div>

                    {/* Context Select */}
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-9 w-28 rounded-lg" />
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {/* Main Chart Area */}
                <Skeleton className="w-full h-[400px] rounded-xl" />
            </CardContent>

            <CardFooter className="pt-6 border-t border-slate-100 block">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Stats Summary Skeleton */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    </div>
                </div>
            </CardFooter>
        </Card>
    )
}
