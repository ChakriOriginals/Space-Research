from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from config import DB_CONFIG

app = Flask(__name__)
CORS(app)
 
def get_db():
    return mysql.connector.connect(**DB_CONFIG)

def query(sql, params=None, fetchone=False):
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute(sql, params or ())
    data = cursor.fetchone() if fetchone else cursor.fetchall()
    cursor.close(); conn.close()
    return data

def execute(sql, params=None):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute(sql, params or ())
    conn.commit()
    last_id = cursor.lastrowid
    cursor.close(); conn.close()
    return last_id

#   ANALYTICS                         ─

@app.route("/api/stats/overview")
def overview():
    return jsonify({
        "total_launches":   query("SELECT COUNT(*) AS c FROM launches", fetchone=True)["c"],
        "total_satellites": query("SELECT COUNT(*) AS c FROM satellites", fetchone=True)["c"],
        "total_companies":  query("SELECT COUNT(*) AS c FROM companies", fetchone=True)["c"],
        "total_countries":  query("SELECT COUNT(*) AS c FROM countries", fetchone=True)["c"],
        "success_rate":     query("SELECT ROUND(SUM(mission_status='Success')*100.0/COUNT(*),1) AS r FROM launches", fetchone=True)["r"],
    })

@app.route("/api/stats/launches-by-year")
def launches_by_year():
    return jsonify(query("""
        SELECT launch_year AS year, COUNT(*) AS total,
               SUM(mission_status='Success') AS successes,
               SUM(mission_status='Failure') AS failures,
               SUM(mission_status='Partial Failure') AS partial
        FROM launches WHERE launch_year IS NOT NULL
        GROUP BY launch_year ORDER BY launch_year"""))

@app.route("/api/stats/satellites-by-orbit")
def satellites_by_orbit():
    return jsonify(query("""
        SELECT ot.orbit_class, COUNT(*) AS count
        FROM satellites s JOIN orbit_types ot ON s.orbit_id=ot.id
        GROUP BY ot.orbit_class ORDER BY count DESC"""))

@app.route("/api/stats/top-companies")
def top_companies():
    return jsonify(query("""
        SELECT co.name, COUNT(*) AS launches,
               ROUND(SUM(l.mission_status='Success')*100.0/COUNT(*),1) AS success_rate
        FROM launches l JOIN companies co ON l.company_id=co.id
        GROUP BY co.name ORDER BY launches DESC LIMIT 10"""))

@app.route("/api/stats/launches-by-status")
def launches_by_status():
    return jsonify(query("""
        SELECT mission_status AS status, COUNT(*) AS count
        FROM launches GROUP BY mission_status ORDER BY count DESC"""))

@app.route("/api/stats/satellites-by-purpose")
def satellites_by_purpose():
    return jsonify(query("""
        SELECT mp.purpose, COUNT(*) AS count
        FROM satellites s JOIN mission_purposes mp ON s.purpose_id=mp.id
        GROUP BY mp.purpose ORDER BY count DESC LIMIT 10"""))

#   LAUNCHES CRUD                       ─

@app.route("/api/launches")
def get_launches():
    page       = int(request.args.get("page", 1))
    limit      = int(request.args.get("limit", 20))
    search     = request.args.get("search", "")
    company_id = request.args.get("company_id", "")
    status     = request.args.get("status", "")
    rocket_id  = request.args.get("rocket_id", "")
    site_id    = request.args.get("site_id", "")
    year_from  = request.args.get("year_from", "")
    year_to    = request.args.get("year_to", "")
    sort_by    = request.args.get("sort_by", "launch_date")
    date_order = request.args.get("date_order", "desc")
    offset     = (page - 1) * limit

    sort_map = {
        "launch_date":       f"l.launch_date {date_order.upper()}",
        "mission_name_asc":  "l.mission_name ASC",
        "mission_name_desc": "l.mission_name DESC",
        "company_asc":       "co.name ASC",
        "rocket_asc":        "r.name ASC",
        "year_asc":          "l.launch_year ASC",
        "year_desc":         "l.launch_year DESC",
    }
    order_clause = sort_map.get(sort_by, f"l.launch_date {date_order.upper()}")

    conditions, params = [], []
    if search:
        conditions.append("l.mission_name LIKE %s"); params.append(f"%{search}%")
    if company_id:
        conditions.append("l.company_id = %s"); params.append(company_id)
    if status:
        conditions.append("l.mission_status = %s"); params.append(status)
    if rocket_id:
        conditions.append("l.rocket_id = %s"); params.append(rocket_id)
    if site_id:
        conditions.append("l.site_id = %s"); params.append(site_id)
    if year_from:
        conditions.append("l.launch_year >= %s"); params.append(year_from)
    if year_to:
        conditions.append("l.launch_year <= %s"); params.append(year_to)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    total = query(f"""SELECT COUNT(*) AS c FROM launches l
                      JOIN companies co ON l.company_id=co.id
                      JOIN rockets r    ON l.rocket_id=r.id
                      JOIN launch_sites ls ON l.site_id=ls.id
                      {where}""", params, fetchone=True)["c"]

    rows = query(f"""
        SELECT l.id, l.launch_date, l.launch_year, l.mission_name,
               l.mission_status, co.name AS company, r.name AS rocket,
               ls.complex AS site, ls.pad
        FROM launches l
        JOIN companies co    ON l.company_id = co.id
        JOIN rockets r       ON l.rocket_id  = r.id
        JOIN launch_sites ls ON l.site_id    = ls.id
        {where}
        ORDER BY {order_clause}
        LIMIT %s OFFSET %s""", params + [limit, offset])

    return jsonify({"data": rows, "total": total, "page": page, "limit": limit})

@app.route("/api/launches/<int:lid>")
def get_launch(lid):
    return jsonify(query("""
        SELECT l.*, co.name AS company, r.name AS rocket,
               ls.complex AS site, ls.pad
        FROM launches l
        JOIN companies co    ON l.company_id = co.id
        JOIN rockets r       ON l.rocket_id  = r.id
        JOIN launch_sites ls ON l.site_id    = ls.id
        WHERE l.id=%s""", (lid,), fetchone=True))

@app.route("/api/launches", methods=["POST"])
def create_launch():
    d = request.json
    lid = execute("""
        INSERT INTO launches (company_id,rocket_id,site_id,launch_date,
                              launch_year,mission_name,mission_status)
        VALUES (%s,%s,%s,%s,%s,%s,%s)""",
        (d["company_id"],d["rocket_id"],d["site_id"],d.get("launch_date"),
         d.get("launch_year"),d.get("mission_name"),d.get("mission_status","Unknown")))
    return jsonify({"id": lid, "message": "Launch created"}), 201

@app.route("/api/launches/<int:lid>", methods=["PUT"])
def update_launch(lid):
    d = request.json
    execute("""
        UPDATE launches SET company_id=%s,rocket_id=%s,site_id=%s,
               launch_date=%s,launch_year=%s,mission_name=%s,mission_status=%s
        WHERE id=%s""",
        (d["company_id"],d["rocket_id"],d["site_id"],d.get("launch_date"),
         d.get("launch_year"),d.get("mission_name"),d.get("mission_status"),lid))
    return jsonify({"message": "Launch updated"})

@app.route("/api/launches/<int:lid>", methods=["DELETE"])
def delete_launch(lid):
    execute("DELETE FROM launches WHERE id=%s", (lid,))
    return jsonify({"message": "Launch deleted"})

#   SATELLITES CRUD (with full filtering)           ─

@app.route("/api/satellites")
def get_satellites():
    page         = int(request.args.get("page", 1))
    limit        = int(request.args.get("limit", 20))
    search       = request.args.get("search", "")
    orbit        = request.args.get("orbit", "")
    purpose_id   = request.args.get("purpose_id", "")
    operator_id  = request.args.get("operator_id", "")
    country_id   = request.args.get("country_id", "")
    year_from    = request.args.get("year_from", "")
    year_to      = request.args.get("year_to", "")
    mass_min     = request.args.get("mass_min", "")
    mass_max     = request.args.get("mass_max", "")
    lifetime_min = request.args.get("lifetime_min", "")
    lifetime_max = request.args.get("lifetime_max", "")
    sort_by      = request.args.get("sort_by", "launch_date")
    date_order   = request.args.get("date_order", "desc")
    offset       = (page - 1) * limit

    # Build ORDER BY
    sort_map = {
        "launch_date":   f"s.launch_date {date_order.upper()}",
        "name_asc":      "s.name ASC",
        "name_desc":     "s.name DESC",
        "mass_desc":     "s.launch_mass_kg DESC",
        "mass_asc":      "s.launch_mass_kg ASC",
        "lifetime_desc": "s.expected_lifetime_yrs DESC",
        "perigee_asc":   "s.perigee_km ASC",
        "apogee_desc":   "s.apogee_km DESC",
    }
    order_clause = sort_map.get(sort_by, f"s.launch_date {date_order.upper()}")

    conditions = []
    params = []

    if search:
        conditions.append("s.name LIKE %s")
        params.append(f"%{search}%")
    if orbit:
        conditions.append("ot.orbit_class = %s")
        params.append(orbit)
    if purpose_id:
        conditions.append("s.purpose_id = %s")
        params.append(purpose_id)
    if operator_id:
        conditions.append("s.operator_id = %s")
        params.append(operator_id)
    if country_id:
        conditions.append("s.country_id = %s")
        params.append(country_id)
    if year_from:
        conditions.append("YEAR(s.launch_date) >= %s")
        params.append(year_from)
    if year_to:
        conditions.append("YEAR(s.launch_date) <= %s")
        params.append(year_to)
    if mass_min:
        conditions.append("s.launch_mass_kg >= %s")
        params.append(mass_min)
    if mass_max:
        conditions.append("s.launch_mass_kg <= %s")
        params.append(mass_max)
    if lifetime_min:
        conditions.append("s.expected_lifetime_yrs >= %s")
        params.append(lifetime_min)
    if lifetime_max:
        conditions.append("s.expected_lifetime_yrs <= %s")
        params.append(lifetime_max)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""

    total = query(f"""
        SELECT COUNT(*) AS c FROM satellites s
        JOIN orbit_types ot ON s.orbit_id = ot.id
        {where}""", params, fetchone=True)["c"]

    rows = query(f"""
        SELECT s.id, s.name, s.launch_date, s.perigee_km, s.apogee_km,
               s.launch_mass_kg, s.expected_lifetime_yrs,
               ot.orbit_class, mp.purpose, op.name AS operator,
               c.name AS country
        FROM satellites s
        JOIN orbit_types ot      ON s.orbit_id    = ot.id
        JOIN mission_purposes mp ON s.purpose_id  = mp.id
        JOIN operators op        ON s.operator_id = op.id
        JOIN countries c         ON s.country_id  = c.id
        {where}
        ORDER BY {order_clause}
        LIMIT %s OFFSET %s""", params + [limit, offset])

    return jsonify({"data": rows, "total": total, "page": page, "limit": limit})

@app.route("/api/satellites/<int:sid>")
def get_satellite(sid):
    return jsonify(query("""
        SELECT s.*, ot.orbit_class, ot.orbit_type,
               mp.purpose, op.name AS operator, c.name AS country,
               con.name AS contractor, lv.name AS vehicle
        FROM satellites s
        JOIN orbit_types ot      ON s.orbit_id      = ot.id
        JOIN mission_purposes mp ON s.purpose_id    = mp.id
        JOIN operators op        ON s.operator_id   = op.id
        JOIN countries c         ON s.country_id    = c.id
        JOIN contractors con     ON s.contractor_id = con.id
        JOIN launch_vehicles lv  ON s.vehicle_id    = lv.id
        WHERE s.id=%s""", (sid,), fetchone=True))

@app.route("/api/satellites", methods=["POST"])
def create_satellite():
    d = request.json
    sid = execute("""
        INSERT INTO satellites
          (name,alternate_names,cospar_number,norad_number,orbit_id,operator_id,
           purpose_id,contractor_id,vehicle_id,country_id,launch_site,launch_date,
           geo_longitude,perigee_km,apogee_km,eccentricity,inclination_deg,
           period_min,launch_mass_kg,expected_lifetime_yrs,comments)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
        (d.get("name"),d.get("alternate_names"),d.get("cospar_number"),
         d.get("norad_number"),d.get("orbit_id"),d.get("operator_id"),
         d.get("purpose_id"),d.get("contractor_id"),d.get("vehicle_id"),
         d.get("country_id"),d.get("launch_site"),d.get("launch_date"),
         d.get("geo_longitude",0),d.get("perigee_km",0),d.get("apogee_km",0),
         d.get("eccentricity",0),d.get("inclination_deg",0),d.get("period_min",0),
         d.get("launch_mass_kg",0),d.get("expected_lifetime_yrs",0),d.get("comments","")))
    return jsonify({"id": sid, "message": "Satellite created"}), 201

@app.route("/api/satellites/<int:sid>", methods=["PUT"])
def update_satellite(sid):
    d = request.json
    execute("""
        UPDATE satellites SET name=%s,alternate_names=%s,launch_date=%s,
               orbit_id=%s,operator_id=%s,purpose_id=%s,perigee_km=%s,
               apogee_km=%s,launch_mass_kg=%s,expected_lifetime_yrs=%s,comments=%s
        WHERE id=%s""",
        (d.get("name"),d.get("alternate_names"),d.get("launch_date"),
         d.get("orbit_id"),d.get("operator_id"),d.get("purpose_id"),
         d.get("perigee_km"),d.get("apogee_km"),d.get("launch_mass_kg"),
         d.get("expected_lifetime_yrs"),d.get("comments"),sid))
    return jsonify({"message": "Satellite updated"})

@app.route("/api/satellites/<int:sid>", methods=["DELETE"])
def delete_satellite(sid):
    execute("DELETE FROM satellites WHERE id=%s", (sid,))
    return jsonify({"message": "Satellite deleted"})

#   LOOKUPS                          ─

@app.route("/api/lookup/companies")
def lookup_companies():
    return jsonify(query("SELECT id, name FROM companies ORDER BY name"))

@app.route("/api/lookup/rockets")
def lookup_rockets():
    return jsonify(query("SELECT id, name, status FROM rockets ORDER BY name"))

@app.route("/api/lookup/launch-sites")
def lookup_sites():
    return jsonify(query("SELECT id, complex, pad FROM launch_sites ORDER BY complex"))

@app.route("/api/lookup/orbit-types")
def lookup_orbits():
    return jsonify(query("SELECT id, orbit_class, orbit_type FROM orbit_types"))

@app.route("/api/lookup/operators")
def lookup_operators():
    return jsonify(query("SELECT id, name FROM operators ORDER BY name"))

@app.route("/api/lookup/purposes")
def lookup_purposes():
    return jsonify(query("SELECT id, purpose FROM mission_purposes ORDER BY purpose"))

@app.route("/api/lookup/contractors")
def lookup_contractors():
    return jsonify(query("SELECT id, name FROM contractors ORDER BY name"))

@app.route("/api/lookup/vehicles")
def lookup_vehicles():
    return jsonify(query("SELECT id, name FROM launch_vehicles ORDER BY name"))

@app.route("/api/lookup/countries")
def lookup_countries():
    return jsonify(query("SELECT id, name FROM countries ORDER BY name"))

if __name__ == "__main__":
    app.run(debug=True, port=5000)
