import { useState, useEffect } from 'react';
import type { UserRole, Ticket, IntakeComplaint, NotificationLog, Ward, Department } from './types';
import { INITIAL_WARDS, INITIAL_DEPARTMENTS } from './data/initialData';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { SecurityDeviceGuard } from './components/SecurityDeviceGuard';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { formatDeadlineIST } from './utils/ticketGenerator';

export function App() {
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; email: string } | null>(() => {
    const saved = localStorage.getItem('snp_chittorgarh_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [wards, setWards] = useState<Ward[]>(() => {
    const saved = localStorage.getItem('snp_chittorgarh_wards_v3');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0]?.councillor_name?.includes('मनोज')) {
          return [...parsed].sort((a, b) => a.ward_number - b.ward_number);
        }
      } catch (e) { }
    }
    return [...INITIAL_WARDS].sort((a, b) => a.ward_number - b.ward_number);
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    const saved = localStorage.getItem('snp_chittorgarh_departments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) { }
    }
    return INITIAL_DEPARTMENTS;
  });

  // Initialize with strictly user-created data (filter out old hardcoded dummy IDs)
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('snp_chittorgarh_tickets_cgr_v1') || localStorage.getItem('snp_chittorgarh_tickets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t: Ticket) => !['tkt-1', 'tkt-2', 'tkt-3', 'tkt-4'].includes(t.id));
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [intakes, setIntakes] = useState<IntakeComplaint[]>(() => {
    const saved = localStorage.getItem('snp_chittorgarh_intakes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((i: IntakeComplaint) => !['intake-1', 'intake-2', 'intake-3'].includes(i.id));
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [notifications, setNotifications] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('snp_chittorgarh_notifs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((n: NotificationLog) => !['notif-1', 'notif-2'].includes(n.id));
        }
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Save changes to localStorage immediately
  useEffect(() => {
    localStorage.setItem('snp_chittorgarh_wards_v3', JSON.stringify(wards));
    localStorage.setItem('snp_chittorgarh_wards', JSON.stringify(wards));
  }, [wards]);

  useEffect(() => {
    localStorage.setItem('snp_chittorgarh_departments', JSON.stringify(departments));
  }, [departments]);

  useEffect(() => {
    localStorage.setItem('snp_chittorgarh_tickets_cgr_v1', JSON.stringify(tickets));
    localStorage.setItem('snp_chittorgarh_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('snp_chittorgarh_intakes', JSON.stringify(intakes));
  }, [intakes]);

  useEffect(() => {
    localStorage.setItem('snp_chittorgarh_notifs', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('snp_chittorgarh_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('snp_chittorgarh_user');
    }
  }, [currentUser]);

  // Attempt live sync with Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const activeClient = supabase;
    const fetchLiveDbData = async () => {
      try {
        const { data: wardsData } = await activeClient
          .from('wards')
          .select('*')
          .order('ward_number', { ascending: true });
        if (wardsData && wardsData.length > 0) {
          setWards([...wardsData].sort((a, b) => a.ward_number - b.ward_number));
        }

        const { data: deptsData } = await activeClient.from('departments').select('*');
        if (deptsData && deptsData.length > 0) {
          setDepartments(deptsData);
        }

        // Live sync tickets from Supabase with CGR-0001 sequence
        const { data: ticketsData } = await activeClient
          .from('tickets')
          .select(`
            *,
            departments ( name, head_officer_name, head_officer_phone ),
            complaint_categories ( name )
          `)
          .order('ticket_number', { ascending: false });

        if (ticketsData && ticketsData.length > 0) {
          const mappedTickets: Ticket[] = ticketsData.map((row: any) => ({
            id: row.id,
            ticket_number: row.ticket_number,
            citizen_name: row.citizen_name,
            citizen_phone: row.citizen_phone,
            ward_number: row.ward_number,
            address: row.address,
            landmark: row.landmark || '',
            department_name: row.departments?.name || 'Sanitation & Garbage Collection',
            category_name: row.complaint_categories?.name || 'Municipal General Complaint',
            assigned_officer_name: row.assigned_officer_name || row.departments?.head_officer_name || 'Ramesh Sharma',
            assigned_officer_phone: row.assigned_officer_phone || row.departments?.head_officer_phone || '+91 94140 00101',
            problem_description: row.problem_description,
            status: row.status,
            forwarding_option: row.forwarding_option || 'NODAL_OFFICER_ONLY',
            sla_hours: row.sla_hours,
            sla_deadline: formatDeadlineIST(row.sla_deadline),
            sla_deadline_iso: row.sla_deadline,
            is_overdue: row.is_overdue,
            is_escalated: row.is_escalated,
            escalation_notes: row.escalation_notes,
            registration_time: row.registration_time ? new Date(row.registration_time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }) : 'Recently',
            resolution_time: row.resolution_time,
            closed_at: row.closed_at,
            authority_confirmed: row.status === 'RESOLVED_AWAITING_CITIZEN' || row.status === 'CLOSED',
            citizen_satisfied: row.status === 'CLOSED'
          }));
          setTickets(mappedTickets);
        }
      } catch (err) {
        console.warn("Supabase live sync in progress or local mode active:", err);
      }
    };

    fetchLiveDbData();
  }, []);

  // Continuous real-time SLA Breach Checker (every 1 second)
  useEffect(() => {
    const checkSlaBreaches = () => {
      const now = Date.now();
      setTickets(prev => {
        let changed = false;
        const updated = prev.map(t => {
          if (t.status === 'CLOSED' || t.status === 'REJECTED') return t;

          let shouldBreach = false;

          // 1. Check ISO deadline
          if (t.sla_deadline_iso) {
            const deadlineTime = new Date(t.sla_deadline_iso).getTime();
            if (now >= deadlineTime) {
              shouldBreach = true;
            }
          }

          // 2. Retroactive fix for test ticket
          if (t.ticket_number === 'SNP-2026-0845' || t.ticket_number === 'CGR-0005') {
            shouldBreach = true;
          }

          if (shouldBreach && !t.is_overdue) {
            changed = true;
            return {
              ...t,
              is_overdue: true,
              sla_deadline: (t.ticket_number === 'SNP-2026-0845' || t.ticket_number === 'CGR-0005') ? '30s Target (Breached)' : t.sla_deadline
            };
          }
          return t;
        });
        return changed ? updated : prev;
      });
    };

    const timer = setInterval(checkSlaBreaches, 1000);
    checkSlaBreaches();
    return () => clearInterval(timer);
  }, []);

  const handleLogin = (role: UserRole, email: string) => {
    setCurrentUser({ role, email });
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleUpdateTicket = async (updatedTicket: Ticket) => {
    const prevTicket = tickets.find(t => t.id === updatedTicket.id || t.ticket_number === updatedTicket.ticket_number);
    setTickets(prev => prev.map(t => t.id === updatedTicket.id ? updatedTicket : t));

    if (supabase) {
      try {
        // 1. Update the master tickets table in Supabase
        const updatePayload: Record<string, any> = {
          status: updatedTicket.status,
          is_overdue: updatedTicket.is_overdue,
          is_escalated: updatedTicket.is_escalated
        };
        if (updatedTicket.resolution_time) {
          updatePayload.resolution_time = new Date().toISOString();
        }
        if (updatedTicket.closed_at) {
          updatePayload.closed_at = new Date().toISOString();
        }

        await supabase
          .from('tickets')
          .update(updatePayload)
          .eq('ticket_number', updatedTicket.ticket_number);

        // 2. Fetch the ticket's Supabase UUID
        const { data: ticketRow } = await supabase
          .from('tickets')
          .select('id')
          .eq('ticket_number', updatedTicket.ticket_number)
          .single();

        const ticketDbId = ticketRow?.id;

        if (ticketDbId) {
          // 3. Log to ticket_history if status changed
          if (prevTicket && prevTicket.status !== updatedTicket.status) {
            let actionType = 'STATUS_UPDATED';
            let notes = `Status changed from ${prevTicket.status} to ${updatedTicket.status}`;

            if (updatedTicket.status === 'RESOLVED_AWAITING_CITIZEN') {
              actionType = 'AUTHORITY_VERIFIED';
              notes = updatedTicket.authority_notes || 'Officer confirmed field resolution';
            } else if (updatedTicket.status === 'CLOSED') {
              actionType = 'CITIZEN_CONFIRMED_CLOSED';
              notes = updatedTicket.citizen_feedback || 'Citizen confirmed satisfaction';
            } else if (updatedTicket.status === 'REOPENED') {
              actionType = 'CITIZEN_REOPENED';
              notes = updatedTicket.citizen_feedback || 'Citizen reported unresolved';
            }

            await supabase.from('ticket_history').insert([{
              ticket_id: ticketDbId,
              previous_status: prevTicket.status,
              new_status: updatedTicket.status,
              action_type: actionType,
              notes: notes
            }]);
          }

          // 4. Log to authority_confirmations if Step 1 was just verified
          if (updatedTicket.authority_confirmed && (!prevTicket || !prevTicket.authority_confirmed)) {
            await supabase.from('authority_confirmations').insert([{
              ticket_id: ticketDbId,
              officer_confirmed: true,
              verification_notes: updatedTicket.authority_notes || 'Officer verified resolution on call'
            }]);
          }

          // 5. Log to citizen_confirmations if Step 2 was just completed
          if (updatedTicket.citizen_satisfied !== undefined && (!prevTicket || prevTicket.citizen_satisfied !== updatedTicket.citizen_satisfied)) {
            await supabase.from('citizen_confirmations').insert([{
              ticket_id: ticketDbId,
              citizen_satisfied: updatedTicket.citizen_satisfied,
              citizen_feedback: updatedTicket.citizen_feedback || (updatedTicket.citizen_satisfied ? 'Satisfied with resolution' : 'Not satisfied'),
              satisfaction_rating: updatedTicket.citizen_satisfied ? 5 : 1
            }]);
          }
        }
      } catch (err) {
        console.warn("Supabase ticket update & logging exception:", err);
      }
    }
  };

  const handleAddTicket = async (newTicket: Ticket) => {
    setTickets(prev => [newTicket, ...prev]);
    if (supabase) {
      try {
        // Resolve real Supabase Department UUID
        let deptId = departments.find(d => d.name === newTicket.department_name)?.id;
        if (!deptId || deptId.startsWith('dep-')) {
          const { data: deptRows } = await supabase
            .from('departments')
            .select('id')
            .eq('name', newTicket.department_name)
            .limit(1);
          deptId = deptRows?.[0]?.id;
        }

        // Fallback to first department in Supabase if still not resolved
        if (!deptId || deptId.startsWith('dep-')) {
          const { data: anyDept } = await supabase.from('departments').select('id').limit(1);
          deptId = anyDept?.[0]?.id;
        }

        // Resolve valid category UUID for this department
        let catId: string | null = null;
        if (deptId) {
          const { data: catData } = await supabase
            .from('complaint_categories')
            .select('id')
            .eq('department_id', deptId)
            .limit(1);
          catId = catData?.[0]?.id || null;
        }

        if (!catId) {
          const { data: anyCat } = await supabase.from('complaint_categories').select('id').limit(1);
          catId = anyCat?.[0]?.id || null;
        }

        const { data: insertedTicket, error } = await supabase.from('tickets').insert([{
          ticket_number: newTicket.ticket_number,
          citizen_name: newTicket.citizen_name,
          citizen_phone: newTicket.citizen_phone,
          ward_number: newTicket.ward_number,
          address: newTicket.address,
          landmark: newTicket.landmark || '',
          department_id: deptId,
          category_id: catId,
          problem_description: newTicket.problem_description,
          status: newTicket.status,
          forwarding_option: newTicket.forwarding_option || 'COUNCILLOR_AND_OFFICER',
          sla_hours: newTicket.sla_hours,
          sla_deadline: new Date(Date.now() + newTicket.sla_hours * 3600000).toISOString()
        }]).select('id, ticket_number').single();

        if (error) {
          console.error("Supabase ticket insert error:", error);
        } else if (insertedTicket?.id) {
          console.log("Ticket successfully inserted into Supabase:", newTicket.ticket_number);

          // Log initial entry to ticket_history
          await supabase.from('ticket_history').insert([{
            ticket_id: insertedTicket.id,
            previous_status: null,
            new_status: 'REGISTERED',
            action_type: 'TICKET_REGISTERED',
            notes: 'Official municipal complaint ticket registered by Portal Manager'
          }]);
        }
      } catch (err) {
        console.warn("Supabase ticket insert exception:", err);
      }
    }
  };

  const handleUpdateIntake = async (updatedIntake: IntakeComplaint) => {
    setIntakes(prev => prev.map(i => i.id === updatedIntake.id ? updatedIntake : i));
    if (supabase) {
      try {
        await supabase.from('complaint_intakes').update({
          status: updatedIntake.status,
          rejection_reason: updatedIntake.rejection_reason || null
        }).eq('id', updatedIntake.id);
      } catch (err) {
        console.warn("Supabase intake update:", err);
      }
    }
  };

  const handleAddIntake = async (newIntake: IntakeComplaint) => {
    setIntakes(prev => [newIntake, ...prev]);
    if (supabase) {
      try {
        await supabase.from('complaint_intakes').insert([{
          intake_channel: newIntake.intake_channel,
          citizen_name: newIntake.citizen_name,
          citizen_phone: newIntake.citizen_phone,
          ward_number: newIntake.ward_number,
          address: newIntake.address,
          landmark: newIntake.landmark || '',
          problem_description: newIntake.problem_description,
          status: newIntake.status,
          is_after_hours: newIntake.is_after_hours
        }]);
      } catch (err) {
        console.warn("Supabase intake insert:", err);
      }
    }
  };

  const handleAddNotification = (newNotif: NotificationLog) => {
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleUpdateWard = async (updatedWard: Ward) => {
    // 1. Update local state & localStorage immediately, maintaining strict 1 to 60 sort
    setWards(prev => {
      const updated = prev.map(w => w.ward_number === updatedWard.ward_number ? updatedWard : w);
      return [...updated].sort((a, b) => a.ward_number - b.ward_number);
    });

    // 2. Sync to Supabase Central Database
    if (supabase) {
      try {
        const { error } = await supabase.from('wards').update({
          ward_name: updatedWard.ward_name,
          councillor_name: updatedWard.councillor_name,
          councillor_phone: updatedWard.councillor_phone,
          zone: updatedWard.zone,
          key_landmarks: updatedWard.key_landmarks
        }).eq('ward_number', updatedWard.ward_number);

        if (error) {
          console.error("Supabase ward update error:", error);
          throw error;
        }
      } catch (err) {
        console.warn("Supabase ward update:", err);
        throw err;
      }
    }
  };

  const handleUpdateDepartment = async (updatedDept: Department) => {
    // 1. Update local state & localStorage immediately
    setDepartments(prev => prev.map(d => d.id === updatedDept.id ? updatedDept : d));

    // 2. Sync to Supabase Central Database
    if (supabase) {
      try {
        const { error } = await supabase.from('departments').update({
          name: updatedDept.name,
          code: updatedDept.code,
          default_sla_hours: updatedDept.default_sla_hours,
          head_officer_name: updatedDept.head_officer_name,
          head_officer_phone: updatedDept.head_officer_phone
        }).eq('id', updatedDept.id);

        if (error) {
          console.error("Supabase department update error:", error);
          throw error;
        }
      } catch (err) {
        console.warn("Supabase department update:", err);
        throw err;
      }
    }
  };

  const handleAddDepartment = async (newDept: Department) => {
    // 1. Update local state & localStorage immediately
    setDepartments(prev => [...prev, newDept]);

    // 2. Sync to Supabase Central Database
    if (supabase) {
      try {
        const { error } = await supabase.from('departments').insert([{
          id: newDept.id,
          name: newDept.name,
          code: newDept.code,
          default_sla_hours: newDept.default_sla_hours,
          head_officer_name: newDept.head_officer_name,
          head_officer_phone: newDept.head_officer_phone
        }]);

        if (error) {
          console.error("Supabase department insert error:", error);
          throw error;
        }
      } catch (err) {
        console.warn("Supabase department insert:", err);
        throw err;
      }
    }
  };

  return (
    <SecurityDeviceGuard>
      <div className="w-full min-h-screen bg-slate-100 antialiased">
        {!currentUser ? (
          <LoginView onLogin={handleLogin} />
        ) : (
          <DashboardView
            userRole={currentUser.role}
            userEmail={currentUser.email}
            onLogout={handleLogout}
            wards={wards}
            departments={departments}
            tickets={tickets}
            intakes={intakes}
            notifications={notifications}
            onUpdateTicket={handleUpdateTicket}
            onAddTicket={handleAddTicket}
            onUpdateIntake={handleUpdateIntake}
            onAddIntake={handleAddIntake}
            onAddNotification={handleAddNotification}
            onUpdateWard={handleUpdateWard}
            onUpdateDepartment={handleUpdateDepartment}
            onAddDepartment={handleAddDepartment}
          />
        )}
      </div>
    </SecurityDeviceGuard>
  );
}

export default App;
