'use client';

import type { ExternalAthlete } from './types';
import { formatAthleteRow } from './externos-formatters';

interface ExternosAthletesTableProps {
  athletes: ExternalAthlete[];
  total: number;
}

export function ExternosAthletesTable({ athletes, total }: ExternosAthletesTableProps) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-telemetry-text-primary mb-2">
        Atletas Sem Conta ({total})
      </h3>
      <div className="bg-telemetry-card rounded-xl shadow border border-telemetry-border/20 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="border-b border-telemetry-border/40 text-sm font-semibold text-telemetry-text-primary">
              <th className="px-3 pb-4 pt-4 text-sm font-medium text-telemetry-text-primary">Nome</th>
              <th className="px-3 pb-4 pt-4 hidden md:table-cell text-sm font-medium text-telemetry-text-primary">Clube</th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Cidade</th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Estado</th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Gênero</th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Idade</th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">
                Rankings <span className="text-[10px] text-telemetry-text-muted font-normal">(posição)</span>
              </th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Data Inserção</th>
              <th className="px-3 pb-4 pt-4 hidden lg:table-cell text-sm font-medium text-telemetry-text-primary">Criado por</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-telemetry-border/20">
            {athletes.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-telemetry-text-muted">
                  Nenhum atleta externo encontrado.
                </td>
              </tr>
            ) : (
              athletes.map((a) => {
                const row = formatAthleteRow(a);
                return (
                  <tr key={a.id} className="border-b border-telemetry-border/10 hover:bg-telemetry-elevated/30 transition-colors">
                    <td className="px-3 py-3 text-sm text-telemetry-text-primary">{row.name}</td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden md:table-cell">{row.club}</td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">{row.city}</td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">{row.state}</td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">{row.gender}</td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">{row.age}</td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">{row.rankings}</td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">{row.createdAt}</td>
                    <td className="px-3 py-3 text-sm text-telemetry-text-muted hidden lg:table-cell">{row.createdBy}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}