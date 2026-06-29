import re
import os

def main():
    file_path = r"c:\app-ingentia\src\pages\Kanban.tsx"
    
    if not os.path.exists(file_path):
        print(f"Error: {file_path} no existe.")
        return
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Agregar la función getTasksBlockedByThis después de getBlockingTasks
    blocking_tasks_def = """  const getBlockingTasks = (task: Task) => {
    const deps = getDependencies(task.tags || []);
    return deps.map(depId => data.tasks[depId]).filter(t => t && t.status !== 'done');
  };"""
  
    new_blocking_tasks_def = """  const getBlockingTasks = (task: Task) => {
    const deps = getDependencies(task.tags || []);
    return deps.map(depId => data.tasks[depId]).filter(t => t && t.status !== 'done');
  };

  const getTasksBlockedByThis = (task: Task) => {
    return Object.values(data.tasks).filter(t => {
      if (t.status === 'done') return false;
      const deps = getDependencies(t.tags || []);
      return deps.includes(task.id);
    });
  };"""

    if blocking_tasks_def in content:
        content = content.replace(blocking_tasks_def, new_blocking_tasks_def)
        print("1. Función getTasksBlockedByThis añadida con éxito.")
    else:
        print("Error: No se encontró getBlockingTasks en Kanban.tsx")

    # 2. Modificar getFilteredTasks para ordenar por proyecto en la vista de estado
    get_filtered_tasks_def = """  const getFilteredTasks = (taskIds: string[]) => {
    return taskIds
      .map(id => data.tasks[id])
      .filter(t => {
        if (!t) return false;
        if (projectFilter !== 'all' && t.project !== projectFilter) return false;
        return true;
      });
  };"""

    new_get_filtered_tasks_def = """  const getFilteredTasks = (taskIds: string[]) => {
    const list = taskIds
      .map(id => data.tasks[id])
      .filter(t => {
        if (!t) return false;
        if (projectFilter !== 'all' && t.project !== projectFilter) return false;
        return true;
      });

    if (groupBy === 'status') {
      // Agrupar/ordenar automáticamente por proyecto (y por ende por color)
      return [...list].sort((a, b) => {
        const projA = a.project || 'General';
        const projB = b.project || 'General';
        if (projA !== projB) {
          return projA.localeCompare(projB);
        }
        return (a.position || 0) - (b.position || 0);
      });
    }
    return list;
  };"""

    if get_filtered_tasks_def in content:
        content = content.replace(get_filtered_tasks_def, new_get_filtered_tasks_def)
        print("2. getFilteredTasks actualizada con ordenamiento por proyecto.")
    else:
        print("Warning: getFilteredTasks firma exacta no encontrada, intentando con expresión regular...")
        # Intentar reemplazo más flexible
        pattern = r"const getFilteredTasks = \(taskIds: string\[\]\) => \{([\s\S]*?)\};"
        match = re.search(pattern, content)
        if match:
            # Reemplazar con la nueva implementación
            content = re.sub(pattern, new_get_filtered_tasks_def, content)
            print("2. getFilteredTasks reemplazado con expresión regular.")
        else:
            print("Error: No se pudo modificar getFilteredTasks")

    # 3. Modificar onDragEnd para evitar conflicto de DnD en la vista de estado
    on_drag_end_status_block = """      if (groupBy === 'status') {
        const startColumn = data.columns[source.droppableId];
        const finishColumn = data.columns[destination.droppableId];
        const newData = { ...data };

        if (startColumn === finishColumn) {
          const newTaskIds = Array.from(startColumn.taskIds);
          newTaskIds.splice(source.index, 1);
          newTaskIds.splice(destination.index, 0, draggableId);
          newData.columns[startColumn.id].taskIds = newTaskIds;
        } else {
          const startTaskIds = Array.from(startColumn.taskIds);
          startTaskIds.splice(source.index, 1);
          newData.columns[startColumn.id].taskIds = startTaskIds;
          const finishTaskIds = Array.from(finishColumn.taskIds);
          finishTaskIds.splice(destination.index, 0, draggableId);
          newData.columns[finishColumn.id].taskIds = finishTaskIds;
        }
        setData(newData);

        const newStatus = COLUMN_TO_STATUS[destination.droppableId];
        const task = data.tasks[draggableId];
        const updates: any = { status: newStatus };
        
        // Calculate position
        const targetColumn = newData.columns[destination.droppableId];
        const newIndex = destination.index;
        let newPos = 0;
        
        if (targetColumn.taskIds.length === 1) {
          newPos = 1000;
        } else if (newIndex === 0) {
          const nextId = targetColumn.taskIds[1];
          newPos = (data.tasks[nextId]?.position || 0) / 2;
        } else if (newIndex === targetColumn.taskIds.length - 1) {
          const prevId = targetColumn.taskIds[newIndex - 1];
          newPos = (data.tasks[prevId]?.position || 0) + 1000;
        } else {
          const prevId = targetColumn.taskIds[newIndex - 1];
          const nextId = targetColumn.taskIds[newIndex + 1];
          newPos = ((data.tasks[prevId]?.position || 0) + (data.tasks[nextId]?.position || 0)) / 2;
        }
        
        updates.position = newPos;

        if (newStatus === 'in-progress' && !task.started_at) {
          updates.started_at = new Date().toISOString();
        } else if (newStatus === 'done' && task.started_at) {
          if (task.actual_hours === undefined || task.actual_hours === null || task.actual_hours <= 0) {
            const started = new Date(task.started_at);
            const now = new Date();
            const diffMs = now.getTime() - started.getTime();
            const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            updates.actual_hours = diffDays;
          }
        }
        
        const { error } = await supabase.from('tasks').update(updates).eq('id', draggableId);
        if (error) {
          if (error.code === '42703') {
            const { error: retryError } = await supabase.from('tasks').update({ status: newStatus }).eq('id', draggableId);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        
        setData(prev => ({
          ...prev,
          tasks: { ...prev.tasks, [draggableId]: { ...prev.tasks[draggableId], ...updates } }
        }));
        calculateAndSaveProjectProgress(data.tasks[draggableId].project);"""

    new_on_drag_end_status_block = """      if (groupBy === 'status') {
        const startColumn = data.columns[source.droppableId];
        const finishColumn = data.columns[destination.droppableId];
        
        // Si se mueve dentro del mismo estado (mismo grupo), no hacemos nada
        // ya que el ordenamiento de color/proyecto es automático
        if (startColumn === finishColumn) {
          setSaving(false);
          return;
        }

        const newStatus = COLUMN_TO_STATUS[destination.droppableId];
        const task = data.tasks[draggableId];
        const updates: any = { status: newStatus };
        
        // Asignar posición al final de la columna de destino
        const targetTasks = Object.values(data.tasks).filter(t => t.status === newStatus);
        const maxPos = targetTasks.reduce((max, t) => Math.max(max, t.position || 0), 0);
        updates.position = maxPos + 1000;

        if (newStatus === 'in-progress' && !task.started_at) {
          updates.started_at = new Date().toISOString();
        } else if (newStatus === 'done' && task.started_at) {
          if (task.actual_hours === undefined || task.actual_hours === null || task.actual_hours <= 0) {
            const started = new Date(task.started_at);
            const now = new Date();
            const diffMs = now.getTime() - started.getTime();
            const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
            updates.actual_hours = diffDays;
          }
        }
        
        const { error } = await supabase.from('tasks').update(updates).eq('id', draggableId);
        if (error) {
          if (error.code === '42703') {
            const { error: retryError } = await supabase.from('tasks').update({ status: newStatus }).eq('id', draggableId);
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
        
        setData(prev => {
          const updatedTasks = { ...prev.tasks, [draggableId]: { ...prev.tasks[draggableId], ...updates } };
          
          // Re-construir los arrays de taskIds de las columnas basándose en el estado de cada tarea
          const newColumns = JSON.parse(JSON.stringify(INITIAL_COLUMNS));
          Object.values(updatedTasks).forEach((t: Task) => {
            const colId = STATUS_MAP[t.status] || 'col-1';
            if (newColumns[colId]) newColumns[colId].taskIds.push(t.id);
          });

          // Asegurar que cada columna esté ordenada por posición
          Object.keys(newColumns).forEach(colId => {
            newColumns[colId].taskIds.sort((a: string, b: string) => (updatedTasks[a].position || 0) - (updatedTasks[b].position || 0));
          });

          return {
            ...prev,
            tasks: updatedTasks,
            columns: newColumns
          };
        });

        calculateAndSaveProjectProgress(data.tasks[draggableId].project);"""

    if on_drag_end_status_block in content:
        content = content.replace(on_drag_end_status_block, new_on_drag_end_status_block)
        print("3. onDragEnd en vista de estado actualizado exitosamente.")
    else:
        # Intentar con un match más corto para ser resilientes a diferencias de formato/espaciado
        print("Warning: Firma exacta de onDragEnd no encontrada. Intentando reemplazo flexible...")
        if "if (groupBy === 'status') {" in content:
            # Reemplazar la sección específica buscando el bloque
            # Dado que el archivo es sensible, usaremos un reemplazo manual alternativo en Python
            start_idx = content.find("if (groupBy === 'status') {")
            # Encontrar el final del bloque (hasta else {)
            end_idx = content.find("} else {", start_idx)
            if start_idx != -1 and end_idx != -1:
                content = content[:start_idx] + new_on_drag_end_status_block + "\n\n      " + content[end_idx:]
                print("3. onDragEnd en vista de estado reemplazado mediante búsqueda de índices.")
            else:
                print("Error: No se pudo localizar los límites de groupBy === 'status'")
        else:
            print("Error: No se encontró 'if (groupBy === 'status') {'")

    # 4. Modificar el renderizado de la tarjeta para las dependencias avanzadas
    # Busquemos la declaración de variables dentro del map de la columna:
    # const taskColor = getProjectColor(task.project);
    # const taskColorInfo = COLOR_MAP[taskColor] || COLOR_MAP.indigo;
    # const blocked = isTaskBlocked(task);
    variables_decl = """                          const taskColor = getProjectColor(task.project);
                          const taskColorInfo = COLOR_MAP[taskColor] || COLOR_MAP.indigo;
                          const blocked = isTaskBlocked(task);"""

    new_variables_decl = """                          const taskColor = getProjectColor(task.project);
                          const taskColorInfo = COLOR_MAP[taskColor] || COLOR_MAP.indigo;
                          const blocked = isTaskBlocked(task);
                          const tasksBlockedByThis = getTasksBlockedByThis(task);"""

    if variables_decl in content:
        content = content.replace(variables_decl, new_variables_decl)
        print("4a. Variables declaradas para dependencias de la tarjeta.")
    else:
        # Intentar con normalización de espacios
        re_var_decl = r"const\s+taskColor\s+=\s+getProjectColor\(task\.project\);\s*const\s+taskColorInfo\s+=\s+COLOR_MAP\[taskColor\]\s*\|\|\s*COLOR_MAP\.indigo;\s*const\s+blocked\s+=\s+isTaskBlocked\(task\);"
        if re.search(re_var_decl, content):
            content = re.sub(re_var_decl, new_variables_decl, content)
            print("4a. Variables declaradas para dependencias de la tarjeta (reemplazo regex).")
        else:
            print("Error: No se pudo declarar las variables en la tarjeta.")

    # Modificar el encabezado de prioridad y bloqueo en la tarjeta
    card_header = """                                    <div className="flex flex-wrap gap-1.5">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${task.priority === 'Alta' ? 'bg-[#FFD166]/20 text-[#222222] border-[#FFD166]/40' : 'bg-black/5 text-[#666666] border-black/5'}`}>{task.priority}</span>
                                      
                                      {/* Blocked Indicator on Card */}
                                      {blocked && (
                                        <span 
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-700 border border-rose-500/25"
                                          title={`Bloqueado por: ${getBlockingTasks(task).map(t => t.title).join(', ')}`}
                                        >
                                          <Lock size={8} /> Bloqueado
                                        </span>
                                      )}
                                    </div>"""

    new_card_header = """                                    <div className="flex flex-wrap gap-1.5">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold border uppercase ${task.priority === 'Alta' ? 'bg-[#FFD166]/20 text-[#222222] border-[#FFD166]/40' : 'bg-black/5 text-[#666666] border-black/5'}`}>{task.priority}</span>
                                      
                                      {blocked && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-700 border border-rose-500/25">
                                          <Lock size={8} /> Bloqueado
                                        </span>
                                      )}
                                      {tasksBlockedByThis.length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/10 text-violet-700 border border-violet-500/25">
                                          <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                          </svg>
                                          Prerrequisito
                                        </span>
                                      )}
                                    </div>"""

    if card_header in content:
        content = content.replace(card_header, new_card_header)
        print("4b. Encabezado de la tarjeta con badges de bloqueo actualizados.")
    else:
        # Reemplazo flexible
        re_header = r"<div className=\"flex flex-wrap gap-1.5\">[\s\S]*?\{/\* Blocked Indicator on Card \*/\}[\s\S]*?\{blocked && \([\s\S]*?\)\s*\}[\s\S]*?<\/div>"
        # Intentemos reemplazar de forma más manual y directa
        print("Warning: Card header no coincide exactamente. Buscando por componentes...")
        # Alternativamente, podemos hacer un reemplazo de texto simple si encontramos el Lock size={8}
        target_lock_span = """                                      {/* Blocked Indicator on Card */}
                                      {blocked && (
                                        <span 
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-700 border border-rose-500/25"
                                          title={`Bloqueado por: ${getBlockingTasks(task).map(t => t.title).join(', ')}`}
                                        >
                                          <Lock size={8} /> Bloqueado
                                        </span>
                                      )}"""
        new_lock_span = """{blocked && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-500/10 text-rose-700 border border-rose-500/25">
                                          <Lock size={8} /> Bloqueado
                                        </span>
                                      )}
                                      {tasksBlockedByThis.length > 0 && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-violet-500/10 text-violet-700 border border-violet-500/25">
                                          <svg className="w-2 h-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                          </svg>
                                          Prerrequisito
                                        </span>
                                      )}"""
        if target_lock_span in content:
            content = content.replace(target_lock_span, new_lock_span)
            print("4b. Badges de bloqueo actualizados (reemplazo de fragmento).")
        else:
            print("Error: No se pudo actualizar el badge superior de la tarjeta.")

    # 5. Agregar la visualización de dependencias detallada debajo del título de la tarea
    card_title_section = """                                  <h5 className="font-semibold text-[#1A1A1A] mb-1.5 leading-snug">{task.title}</h5>"""
    
    new_card_title_section = """                                  <h5 className="font-semibold text-[#1A1A1A] mb-1.5 leading-snug">{task.title}</h5>
                                  
                                  {/* Visualización avanzada de dependencias bi-direccionales */}
                                  {(blocked || tasksBlockedByThis.length > 0) && (
                                    <div className="flex flex-col gap-1.5 my-2.5">
                                      {blocked && (
                                        <div className="flex flex-col gap-1 p-2 rounded-xl bg-rose-50 border border-rose-100/60">
                                          <span className="text-[8px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                                            <Lock size={10} /> Bloqueado por:
                                          </span>
                                          <div className="flex flex-wrap gap-1">
                                            {getBlockingTasks(task).map(t => (
                                              <span key={t.id} className="inline-flex bg-white text-rose-700 text-[8px] px-1.5 py-0.5 rounded border border-rose-200 font-medium truncate max-w-[150px]" title={t.title}>
                                                {t.title}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {tasksBlockedByThis.length > 0 && (
                                        <div className="flex flex-col gap-1 p-2 rounded-xl bg-violet-50 border border-violet-100/60">
                                          <span className="text-[8px] font-bold text-violet-600 uppercase tracking-wider flex items-center gap-1">
                                            <svg className="w-2.5 h-2.5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                            </svg>
                                            Bloquea a:
                                          </span>
                                          <div className="flex flex-wrap gap-1">
                                            {tasksBlockedByThis.map(t => (
                                              <span key={t.id} className="inline-flex bg-white text-violet-700 text-[8px] px-1.5 py-0.5 rounded border border-violet-200 font-medium truncate max-w-[150px]" title={t.title}>
                                                {t.title}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  )}"""

    if card_title_section in content:
        content = content.replace(card_title_section, new_card_title_section)
        print("5. Visualización detallada de dependencias bidireccionales añadida con éxito.")
    else:
        print("Error: No se encontró la etiqueta de h5 para task.title")

    # Guardar cambios
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
        
    print("Modificaciones en Kanban.tsx aplicadas correctamente.")

if __name__ == "__main__":
    main()
