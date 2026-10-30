import PetitionList from './PetitionList'
import type { PetitionType } from './Petition'
import { GET } from '../api/specialRoute'
import type { PetitionSort } from '@/old/lib/petitionSort'

export default async function PetitionContainer({
    query,
    tag, 
    status,
    sort = ''
}: {
    query?: string
    tag?: string
    status?: string
    sort?: PetitionSort
}) {
    const PAGE = 1;
    const ITEMS = 40;

    let initialData: PetitionType[] = [];

    try {
        const result = await GET(query, status, tag, PAGE, ITEMS, sort);
        initialData = result.petitions || [];
    } catch (err) {
        console.error("Error inside container:", err);
        initialData = [];
    }

    return (
        <div className="petitions-outer">
            <PetitionList 
                key={JSON.stringify([query, tag, status, sort])}
                initialData={initialData} 
                query={query} 
                tag={tag} 
                status={status} 
                sort={sort}
            />
        </div>
    );
}
