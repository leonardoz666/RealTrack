import { z } from 'zod';
import { TIPOS_APOSTA } from '../constants/tiposAposta';
import { STATUS_APOSTAS } from '../constants/statusApostas';
import { CASAS_APOSTAS } from '../constants/casasApostas';
import { ESPORTES } from '../constants/esportes';

const baseSchema = z.object({
  bancaId: z.string().min(1, 'Selecione uma banca'),
  esporte: z.enum([...ESPORTES] as [string, ...string[]], {
    required_error: 'Selecione um esporte',
  }),
  evento: z.string().min(3, 'Nome do evento deve ter pelo menos 3 caracteres'),
  aposta: z.string().min(3, 'Descrição da aposta deve ter pelo menos 3 caracteres'),
  torneio: z.string().optional(),
  pais: z.string().optional(),
  mercado: z.string().min(1, 'Informe o mercado'),
  tipoAposta: z.enum([...TIPOS_APOSTA] as [string, ...string[]], {
    required_error: 'Selecione o tipo de aposta',
  }),
  valorApostado: z.coerce.number().min(0.01, 'Valor deve ser maior que 0'),
  odd: z.coerce.number().min(1.01, 'Odd deve ser maior que 1.00'),
  bonus: z.coerce.number().optional(),
  dataEvento: z.string().min(10, 'Data inválida'),
  tipster: z.string().optional(),
  status: z.enum([...STATUS_APOSTAS] as [string, ...string[]], {
    required_error: 'Selecione o status',
  }).default('Pendente'),
  casaDeAposta: z.enum([...CASAS_APOSTAS] as [string, ...string[]], {
    required_error: 'Selecione uma casa de aposta',
  }),
  retornoObtido: z.coerce.number().optional(),
});

export const apostaSchema = baseSchema;

export type ApostaFormValues = z.infer<typeof apostaSchema>;
