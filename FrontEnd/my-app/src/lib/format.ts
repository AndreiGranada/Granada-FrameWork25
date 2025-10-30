export function minutesToHHMM(m: number): string {
    const hh = Math.floor(m / 60);
    const mm = m % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function daysOfWeekFromBitmask(mask: number): string {
    if (mask === 0) return 'Todos os dias';
    const map: Record<number, string> = {
        1: 'Dom',
        2: 'Seg',
        4: 'Ter',
        8: 'Qua',
        16: 'Qui',
        32: 'Sex',
        64: 'Sáb',
    };
    const labels: string[] = [];
    let bit = 1;
    while (bit <= 64) {
        if (mask & bit) labels.push(map[bit]);
        bit <<= 1;
    }
    return labels.join(', ');
}
