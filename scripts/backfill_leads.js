import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function backfillLeads() {
  console.log('Iniciando backfill de consistencia de leads...');
  const { data: leads, error } = await supabase
    .from('leads_cuentas')
    .select('*')
    .not('pre_call_brief', 'is', null);

  if (error) {
    console.error('Error fetching leads:', error);
    return;
  }

  let updatedCount = 0;

  for (const lead of leads) {
    const brief = lead.pre_call_brief;
    const updateData = {};

    // Check what is missing in the root and what is available in the brief
    if (!lead.empleados_estimado && brief.perfil?.empleados_estimado && brief.perfil.empleados_estimado !== 'sin dato') {
      updateData.empleados_estimado = brief.perfil.empleados_estimado;
    }
    
    if (!lead.sector && brief.industry && brief.industry !== 'sin dato') {
      updateData.sector = brief.industry;
    }

    if (!lead.localidad && brief.perfil?.plantas_ubicaciones && brief.perfil.plantas_ubicaciones !== 'sin dato') {
      updateData.localidad = brief.perfil.plantas_ubicaciones;
    }

    if (brief.redes) {
      if (!lead.web && brief.redes.web) updateData.web = brief.redes.web;
      if (!lead.linkedin_empresa && brief.redes.linkedin) updateData.linkedin_empresa = brief.redes.linkedin;
      if (!lead.instagram && brief.redes.instagram) updateData.instagram = brief.redes.instagram;
      if (!lead.facebook && brief.redes.facebook) updateData.facebook = brief.redes.facebook;
    }

    if (Object.keys(updateData).length > 0) {
      console.log(`Actualizando lead ${lead.id} (${lead.empresa}) con:`, updateData);
      const { error: updateError } = await supabase
        .from('leads_cuentas')
        .update(updateData)
        .eq('id', lead.id);
      
      if (updateError) {
        console.error(`Error actualizando lead ${lead.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Backfill completado. Se actualizaron ${updatedCount} leads.`);
}

backfillLeads();
