# Debug Journal

Complete one entry per bug. All six entries are required for full marks.

---

## Bug 1 — Silent RLS Block

| Field          | Your Entry                                                                                                                                                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Symptom**    | When opening the dashboard page, the shipments table displays “No Data Found” even though the database contains 5 shipment rows.                                                                                                                                                 |
| **Hypothesis** | Row Level Security is enabled on the shipments table but there is no SELECT policy, preventing the frontend from reading the data.                                                                                                                                               |
| **AI Prompt**  | I'm debugging a Supabase table where RLS is enabled, and only see an update policy defined. My frontend query returns no rows even though the table clearly has data. Do I also need to define an explicit select policy for reads, or is there a default policy that allows it? |
| **Fix**        | Added a SELECT policy to allow read access: create policy "Allow anon select" on shipments for select using (true);                                                                                                                                                              |

### SQL Fix

````sql
create policy "Allow anon select"
on shipments
for select
using (true);

---

## Bug 2 — Ghost Mutation

| Field      | Your Entry                                                                                                                                                                                                                                   |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Symptom    | The dashboard shows a success toast when changing shipment status, but after refresh the status reverts to the original.                                                                                                                     |
| Hypothesis | The server action executes the Supabase update query without awaiting the result or checking for errors, causing it to return success even if the update fails.                                                                              |
| AI Prompt  | 1. Debugging a server action: updating shipment status always returns success but doesn't persist. What could cause this?<br>2. If a Supabase update call isn't awaited in an async function, could it return before the mutation completes? |
| Fix        | Added `await` to the Supabase update query and checked the returned `{ error }` before returning success.                                                                                                                                    |


| Field          | Your Entry                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Symptom**    | Opening the dashboard page causes the UI to freeze and the server logs show repeated `GET /dashboard` requests being triggered continuously. The page keeps reloading and becomes unresponsive after a short time.                                                                                                                                                                                                                                                                                                                                                                                                           |
| **Hypothesis** | In the `DataTable` component, the state of the table's sorting is synchronized with the URL via `router.push()` inside a `useEffect` hook. The dependency array for the hook includes `table.getState().sorting`, which creates a new reference every render. This causes the effect to run on every render, leading to a loop by repeatedly calling `router.push()` and rerendering the component. Additionally, including `searchParams` in the dependency array causes the effect to run every time the URL changes.                                                                                                      |
| **AI Prompt**  | 1. I'm debugging the dashboard page, which sends repeated `GET /dashboard` requests and eventually freezes the page. It seems to happen inside a client-side `DataTable` component, syncing the sorting state with the URL by using `router.push()` inside a `useEffect`. Does calling `router.push()` inside a `useEffect` potentially cause an infinite rerender loop with Next.js?<br><br>2. While investigating, ESLint also shows this warning: *"React Hook useEffect has a missing dependency: 'sorting'. Either include it or remove the dependency array."* What does this mean?<br><br>3. Here's the code snippet: 

 useEffect(() => {
  const params = new URLSearchParams(searchParams.toString());

  if (sorting.length > 0) {
    params.set('sort', sorting[0].id);
    params.set('desc', String(sorting[0].desc));
  } else {
    params.delete('sort');
    params.delete('desc');
  }

  router.push(`/dashboard?${params.toString()}`);
}, [table.getState().sorting, searchParams, router]);

4. If I change the dependency to use the sorting state directly instead of table.getState().sorting, would that be a more stable dependency and prevent the rerender loop?

5. I tried to modify the dependency array to include the sorting, searchParams, and router as suggested to satisfy the ESLint warnings. However, the dashboard view keeps reloading with the URL "/dashboard" to trigger an infinite loop. Could the inclusion of the searchParams object into the dependency array cause the effect to run every time the URL changes due to the router.push() function?
          |
| **Fix**        | Updated the useEffect dependency to rely on the stable sorting state instead of table.getState().sorting. Also avoided depending on searchParams, since router.push() updates the URL and would retrigger the effect. This prevents the continuous rerender loop while still keeping the sorting state synchronized with the URL.           |

---

## Bug 4 — The Unreliable Search

| Field          | Your Entry |
| -------------- | ---------- |
| **Symptom**    | The Cargo column in the dashboard table may display "kg" or be empty when actual data is present in the database table. The dash "—" is displayed only in rows with null values in the cargo column.           |
| **Hypothesis** | The frontend code assumes the data for cargo_details is an object, but the data retrieved from Supabase is an array of objects. Accessing .item and .weight_kg on the array does not display anything on the screen. Also, the TypeScript Shipment type does not match the data, which is causing the error on the cargo[0] access.           |
| **AI Prompt**  | 1. I'm debugging a dashboard table for bug 4. The Cargo column sometimes displays just "kg" or is empty, even though there is cargo data in the database. What do you think I should check first? The frontend or a query from Supabase?

2. I've console.logged the shipments data from Supabase and the results are like this: { id: "...", status: "In Transit", cargo_details: [ { item: "Steel Pipes", weight_kg: 120 } ] }. But the UI still only displays "kg." Where do you think the problem might lie?

3. Here’s the column cell code: cell: ({ row }) => { const cargo = row.getValue<Shipment['cargo_details']>('cargo_details'); if (!cargo) return <span>—</span>; return <div><p>{cargo.item}</p><p>{cargo.weight_kg} kg</p></div>; }. Is there a possibility that the way I am accessing the data is wrong?

4. I tried changing it to: const cargoArray = row.getValue('cargo_details'); const cargo = cargoArray?.[0]; However, the TypeScript error says the property '0' doesn't exist. Does that mean my Shipment type is wrong?
           |
| **Fix**        | 1. Update the frontend code to treat cargo_details as an array:
ts const cargoArray = row.getValue<Shipment['cargo_details']>('cargo_details'); const cargo = cargoArray?.[0];

2. Update the Shipment type to match the actual Supabase data:
```ts export type Shipment = { id: string; created_at: string; status: string; cargo_details: { item: string; weight_kg: number }[]
           |

---

## Bug 5 — The Unreliable Search

| Field          | Your Entry |
| -------------- | ---------- |
| **Symptom**    |  The search input in the dashboard table sends multiple API requests when the user types quickly.
Each key press triggers a new request to /dashboard, which can be observed in the server logs. Example server logs when typing quickly:
POST /dashboard
. . .
POST /dashboard
          |
| **Hypothesis** |  This happens because the API call is being made for every key press in the onChange event. This is a problem because, in most cases, a user will be typing multiple characters in quick succession, meaning multiple API requests will be made before the previous one finishes.

This is likely to cause problems, as it is making unnecessary API requests. There should be a mechanism in place to debounce, so the API request is only made after a certain time has elapsed since the user last typed.
          |
| **AI Prompt**  | 1.  I have a search input in my React table that calls this function on every key press:
const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const query = e.target.value;
  setLoading(true);
  const results = await searchShipments(query);
  setTableData(results as TData[]);
  setLoading(false);
This function is triggered from an input onChange. When I type quickly, I see multiple POST /dashboard requests in the server logs. What is causing this behavior?
What is the common way to prevent sending API requests on every keypress in a search input?

2. How can I apply a debounce mechanism to this search handler so the API call only runs after the user stops typing for a short time?
const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
const query = e.target.value;
  setLoading(true);
  const results = await searchShipments(query);
  setTableData(results as TData[]);
  setLoading(false);
};

3. But rather than dealing with the timer in the handler function, would it not be cleaner to encapsulate the API call in a separate function and then debounce that?
okk makes sense.  However, I would prefer to keep everything inside my existing DataTable component file instead of creating separate utilities or hooks. Can I simply define a small debounce helper function in the same file and use it with my runSearch(query) function?

4. I implemented the debounce helper you suggested, but TypeScript warns about using `any` in this line:
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number)
Unexpected any. Specify a different type. How can I type this debounce function properly without using `any`?         |
| **Fix**        |  Add a runSearch function inside the DataTable file that handles loading state, calls searchShipments(query), and updates tableData.
Add a helper function, debounce, inside the same file. This function accepts a function and a delay. It returns a debounced version of the function.
Use the useMemo hook to create a debounced version of runSearch. This is to prevent recreating the function on every render.
Modify the onChange function of the search input to call the debounced function instead of calling runSearch.
          |

---

## Bug 6 — The Persistent Ghost

| Field          | Your Entry |
| -------------- | ---------- |
| **Symptom**    | When updating the shipment status from 'Delivered' to 'Pending', a green success toast is displayed, indicating a successful operation. However, in reality, no changes are reflected in the database. After refreshing the page, it remains in 'Delivered' status. Other transitions work fine.           |
| **Hypothesis** | However, Supabase has a policy (trigger/RLS) in place that does not allow a shipment in a 'Delivered' state to be changed to 'Pending'. The frontend code in handleStatusUpdate is displaying a success toast notification, but it does not verify if the Supabase call was successful. This is giving a false sense of success when, in fact, it was denied by the database.           |
| **AI Prompt**  |  1. I call updateShipmentStatus(id, status) from my frontend. When I change Delivered → Pending, nothing prints in the server console. How can I add logging inside updateShipmentStatus to see what Supabase returns?

2. I want to see what data and error Supabase returns when updating a shipment status. What’s the best place to add console.log statements inside updateShipmentStatus without changing the logic? For example, I want to log: Supabase error: ... Updated rows: …

3. After adding console.log, I tried Delivered → Pending. I see in the server console: [SERVER] Supabase error: Cannot revert a delivered shipment to pending status How do I understand what is happening, and what is the reason that the frontend shows me success with the toast?

4/ The logs show Supabase prevents Delivered → Pending. I want the frontend to show an error toast when this happens, instead of a false success. How can I return a structured error from updateShipmentStatus to the frontend while keeping changes minimal?

5. I now have updateShipmentStatus returning { success: boolean; data?: T; error?: string }. In my columns.tsx, the handleStatusUpdate function currently always calls toast.success("Status updated successfully"). How can I modify handleStatusUpdate to read the success property and show either a success or error toast, keeping the changes minimal and inside this file?
          |
| **Fix**        |  Add console.log statements within the updateShipmentStatus function to see the results returned by Supabase for data and error.
Return a structured object from updateShipmentStatus that indicates the success of the operation and shows the error message if the update fails.
Modify the handleStatusUpdate function to check the success property. Display a success toast if the update is successful, and display an error toast if the update fails.
          |
````
