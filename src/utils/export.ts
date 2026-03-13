import { Guest, Table, SeatAssignment } from '../types';

export function exportGuestListByName(
  guests: Guest[],
  tables: Table[],
  seatAssignments: SeatAssignment[]
): string {
  const sorted = [...guests].sort((a, b) =>
    `${a.surname} ${a.name}`.localeCompare(`${b.surname} ${b.name}`)
  );

  const lines = ['Guest List by Name', '==================', ''];
  
  for (const guest of sorted) {
    const assignment = seatAssignments.find(a => a.guestId === guest.id);
    const table = assignment ? tables.find(t => t.id === assignment.tableId) : null;
    const tableInfo = table ? `Table ${table.number}` : 'Unassigned';
    lines.push(`${guest.surname}, ${guest.name} — ${tableInfo}`);
  }

  return lines.join('\n');
}

export function exportGuestListByTable(
  guests: Guest[],
  tables: Table[],
  seatAssignments: SeatAssignment[]
): string {
  const lines = ['Guest List by Table', '===================', ''];

  const sortedTables = [...tables].sort((a, b) => a.number - b.number);

  for (const table of sortedTables) {
    lines.push(`${table.label} (${table.seats} seats)`);
    lines.push('-'.repeat(30));
    
    const tableAssignments = seatAssignments.filter(a => a.tableId === table.id);
    const tableGuests = tableAssignments
      .map(a => guests.find(g => g.id === a.guestId))
      .filter(Boolean) as Guest[];
    
    if (tableGuests.length === 0) {
      lines.push('  (no guests assigned)');
    } else {
      tableGuests.forEach((g, i) => {
        lines.push(`  ${i + 1}. ${g.name} ${g.surname}`);
      });
    }
    
    const empty = table.seats - tableGuests.length;
    lines.push(`  Empty seats: ${empty}`);
    lines.push('');
  }

  const unassigned = guests.filter(
    g => !seatAssignments.find(a => a.guestId === g.id)
  );
  
  if (unassigned.length > 0) {
    lines.push('Unassigned Guests');
    lines.push('-'.repeat(30));
    unassigned.forEach(g => lines.push(`  ${g.name} ${g.surname}`));
  }

  return lines.join('\n');
}

export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportSeatingChartPDF(canvasElement: HTMLElement, filename: string): Promise<void> {
  try {
    const html2canvas = (await import('html2canvas')).default;
    const { default: jsPDF } = await import('jspdf');
    
    const canvas = await html2canvas(canvasElement, { scale: 2, backgroundColor: '#faf8f5' });
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgAspect = canvas.width / canvas.height;
    
    let imgWidth = pageWidth - 20;
    let imgHeight = imgWidth / imgAspect;
    
    if (imgHeight > pageHeight - 20) {
      imgHeight = pageHeight - 20;
      imgWidth = imgHeight * imgAspect;
    }
    
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;
    
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    pdf.save(filename);
  } catch (error) {
    console.error('PDF export failed:', error);
    throw error;
  }
}
