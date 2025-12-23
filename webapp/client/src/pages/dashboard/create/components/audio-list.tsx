import AudioListItem from "./audio-list-item"

export interface AudioItem {
    id: string
    title: string
    subtitle?: React.ReactNode
    tags?: string[]
    rightElement?: React.ReactNode
}

interface AudioListProps {
    items: AudioItem[]
    selectedId?: string
    playingId?: string | null
    onSelect: (id: string) => void
    onTogglePlay: (id: string) => void
    onDelete?: (id: string) => void
}

export default function AudioList({
    items,
    selectedId,
    playingId,
    onSelect,
    onTogglePlay,
    onDelete
}: AudioListProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => {
                const isSelected = selectedId === item.id
                const isPlaying = playingId === item.id

                return (
                    <AudioListItem
                        key={item.id}
                        id={item.id}
                        title={item.title}
                        subtitle={item.subtitle}
                        badge={item.tags && item.tags.length > 0 ? {
                            text: item.tags[0],
                            variant: item.tags[0] === 'POPULAR' ? 'blue' : 'purple'
                        } : undefined}
                        rightElement={item.rightElement}
                        isSelected={isSelected}
                        isPlaying={isPlaying}
                        onSelect={() => onSelect(item.id)}
                        onTogglePlay={(e) => {
                            e.stopPropagation()
                            onTogglePlay(item.id)
                        }}
                        onDelete={onDelete ? (e) => {
                            e.stopPropagation()
                            onDelete(item.id)
                        } : undefined}
                    />
                )
            })}
        </div>
    )
}
