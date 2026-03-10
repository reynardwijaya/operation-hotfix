# Audit Trail Implementation

## Overview

To support operational transparency, an **Audit Trail** system has been put in place to track each status change for a shipment.  
The aim is to maintain a history of what has happened and when. It answers the questions:

> What changed? And when did it change?

Each time a status change occurs for a shipment, the system automatically records:

- Old status
- New status
- Timestamp of the change

---

## 1. Schema Design

A new table `audit_logs` was created to store shipment status changes:

```sql
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references shipments(id) on delete cascade,
  old_status text not null,
  new_status text not null,
  changed_at timestamptz default now()
);
```

### Column Rationale

| Column          | Purpose                                                                           |
| --------------- | --------------------------------------------------------------------------------- |
| **id**          | Unique identifier for each audit log entry.                                       |
| **shipment_id** | References the shipment whose status was changed. Maintains relational integrity. |
| **old_status**  | Stores the shipment status before the update.                                     |
| **new_status**  | Stores the shipment status after the update.                                      |
| **changed_at**  | Timestamp of when the status change occurred.                                     |

**Notes:**

- `shipment_id` uses a foreign key constraint to enforce referential integrity.
- `ON DELETE CASCADE` ensures audit entries are removed if the parent shipment is deleted.

---

## 2. Row Level Security (RLS)

RLS is **enabled** for the `audit_logs` table:

```sql
alter table audit_logs enable row level security;
```

Policies were added to allow reading audit logs and inserting new records via the database trigger:

```sql
create policy "Allow read audit logs"
on audit_logs
for select
using (true);

create policy "Allow audit trigger inserts"
on audit_logs
for insert
with check (true);
```

### Rationale

- Audit logs are **historical records** and should not be modified by clients.
- Users can **read** audit logs, but cannot update or delete them.
- New log entries are written automatically by the **database trigger**, ensuring that every status change is recorded.

---

## 3. Insert Mechanism

**Chosen approach: Database Trigger**

Trigger function:

```sql
create or replace function log_shipment_status_change()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into audit_logs (
      shipment_id,
      old_status,
      new_status,
      changed_at
    )
    values (
      old.id,
      old.status,
      new.status,
      now()
    );
  end if;

  return new;
end;
$$ language plpgsql;
```

Attach the trigger to `shipments`:

```sql
create trigger audit_shipment_status
after update on shipments
for each row
execute function log_shipment_status_change();
```

**Behavior:**

1. PostgreSQL detects an `UPDATE` on `shipments`.
2. The trigger runs the function `log_shipment_status_change()`.
3. If `status` changed, an entry is inserted into `audit_logs`.
4. No changes in application code are needed — all updates are automatically logged.

---

## 4. Trade-offs

### Database Trigger (Chosen)

**Advantage:**  
Ensures **audit consistency at the database level**. All status changes are captured regardless of source (application server, direct SQL, admin tools, background jobs). Prevents bypassing audit logging.

### Server Action (Alternative)

**Advantage:**  
Keeps logging centralized in the application code, easier to reason about for developers.

**Disadvantage:**  
Updates outside the application layer (SQL scripts, admin tools) would **not be logged**, leading to incomplete audit history.
