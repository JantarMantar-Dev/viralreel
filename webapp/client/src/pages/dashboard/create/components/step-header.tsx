interface StepHeaderProps {
    title: string
    description: string
}

export default function StepHeader({ title, description }: StepHeaderProps) {
    return (
        <div className="text-center mb-8 md:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-3 md:mb-4">
                {title}
            </h1>
            <p className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto font-medium px-4">
                {description}
            </p>
        </div>
    )
}
