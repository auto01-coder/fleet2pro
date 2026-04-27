'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

function serverSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export async function saveVehicleAction(formData: FormData) {
  const sb  = serverSupabase()
  const id  = formData.get('id') as string | null

  const payload = {
    targa:          (formData.get('targa') as string).toUpperCase().trim(),
    marca:          formData.get('marca') as string,
    modello:        formData.get('modello') as string,
    anno:           Number(formData.get('anno')),
    carburante:     formData.get('carburante') as string,
    km_attuali:     Number(formData.get('km_attuali')),
    tipologia:      formData.get('tipologia') as string,
    tipo_noleggio:  formData.get('tipo_noleggio') as string || null,
    stato:          formData.get('stato') as string,
    costo_mensile:  Number(formData.get('costo_mensile')),
    prezzo_mensile_cliente: formData.get('prezzo_mensile_cliente') ? Number(formData.get('prezzo_mensile_cliente')) : null,
    costo_assicurazione:   formData.get('costo_assicurazione')   ? Number(formData.get('costo_assicurazione'))   : null,
    costo_bollo:           formData.get('costo_bollo')           ? Number(formData.get('costo_bollo'))           : null,
    costo_manutenzione:    formData.get('costo_manutenzione')    ? Number(formData.get('costo_manutenzione'))    : null,
    assicurazione_data:    (formData.get('assicurazione_data') as string) || null,
    bollo_data:            (formData.get('bollo_data') as string)         || null,
    tagliando_data:        (formData.get('tagliando_data') as string)     || null,
    immatricolazione:      (formData.get('immatricolazione') as string)   || null,
    km_contratto:          formData.get('km_contratto') ? Number(formData.get('km_contratto')) : null,
    data_fine_contratto:   (formData.get('data_fine_contratto') as string) || null,
    note:                  (formData.get('note') as string) || null,
    attivo:                true,
  }

  if (id) {
    const { error } = await sb.from('vehicles').update(payload).eq('id', id)
    if (error) return { error: error.message }
  } else {
    const { error } = await sb.from('vehicles').insert(payload)
    if (error) return { error: error.message }
  }

  revalidatePath('/flotta')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteVehicleAction(id: string) {
  const sb = serverSupabase()
  const { error } = await sb.from('vehicles').update({ attivo: false }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/flotta')
  return { success: true }
}
