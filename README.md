# ⬡ Space Research Dashboard

A full-stack web application for exploring, managing, and visualizing space launch and satellite data. Built with a Flask REST API backend and a React frontend.

---

## 🚀 Features

- **Dashboard** — Overview stats, interactive launches-per-year line chart, donut charts for orbit types and mission status, and bar charts for top companies and satellite purposes
- **Launches** — Browse, search, filter, sort, and paginate all launch records with full CRUD support
- **Satellites** — Browse, search, filter, sort, and paginate all satellite records with full CRUD support
- **Advanced Filtering** — Filter by year range, company, status, rocket, launch site, orbit, purpose, operator, country, mass range, and lifetime range
- **Active Filter Tags** — Visual tags showing active filters with one-click removal
- **Toast Notifications** — Real-time success/error feedback on all operations
- **Responsive Design** — Adapts to different screen sizes

---

## 🛠️ Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, Axios             |
| Backend   | Python, Flask, Flask-CORS         |
| Database  | MySQL                             |
| Fonts     | Space Mono, Outfit (Google Fonts) |

---

## 📁 Project Structure

```
Space-Research/
├── space_app/
│   ├── backend/
│   │   ├── app.py            # Flask REST API
│   │   ├── config.py         # MySQL connection config
│   │   └── requirements.txt  # Python dependencies
│   └── frontend/
│       ├── index.html
│       ├── package.json
│       ├── vite.config.js
│       └── src/
│           ├── main.jsx          # React entry point
│           ├── App.jsx           # Root component + layout
│           ├── index.css         # Global design system
│           ├── api/
│           │   └── index.js      # Axios API client
│           └── pages/
│               ├── Dashboard.jsx
│               ├── Launches.jsx
│               └── Satellites.jsx
└── .gitignore
```

---

## ⚙️ Setup & Installation

### Prerequisites

- Python 3.8+
- Node.js 20+
- MySQL 8+

---

### 1. Clone the Repository

```bash
git clone https://github.com/ChakriOriginals/Space-Research.git
cd Space-Research
```

---

### 2. Database Setup

Create the MySQL database:

```sql
CREATE DATABASE space_research;
```

The database uses the following tables (inferred from the API):

- `launches` — launch records
- `satellites` — satellite records
- `companies` — launch companies
- `rockets` — rocket types
- `launch_sites` — launch site locations
- `orbit_types` — orbit classifications
- `operators` — satellite operators
- `mission_purposes` — satellite mission purposes
- `contractors` — satellite contractors
- `launch_vehicles` — launch vehicles
- `countries` — country records

---

### 3. Backend Setup

```bash
cd space_app/backend
pip install -r requirements.txt
```

Update `config.py` with your MySQL credentials:

```python
DB_CONFIG = {
    "host":     "localhost",
    "port":     3306,
    "user":     "your_username",
    "password": "your_password",
    "database": "space_research"
}
```

Run the Flask server:

```bash
python app.py
```

The backend will start at `http://localhost:5000`

---

### 4. Frontend Setup

```bash
cd space_app/frontend
npm install
npm run dev
```

The frontend will start at `http://localhost:5173`

---

## 📡 API Endpoints

### Analytics

| Method | Endpoint                        | Description                        |
|--------|---------------------------------|------------------------------------|
| GET    | `/api/stats/overview`           | Total launches, satellites, companies, countries, success rate |
| GET    | `/api/stats/launches-by-year`   | Launch counts grouped by year      |
| GET    | `/api/stats/satellites-by-orbit`| Satellite counts grouped by orbit  |
| GET    | `/api/stats/top-companies`      | Top 10 companies by launch count   |
| GET    | `/api/stats/launches-by-status` | Launch counts grouped by status    |
| GET    | `/api/stats/satellites-by-purpose` | Top 10 satellite purposes       |

---

### Launches

| Method | Endpoint              | Description              |
|--------|-----------------------|--------------------------|
| GET    | `/api/launches`       | List launches (paginated, filterable) |
| GET    | `/api/launches/<id>`  | Get a single launch      |
| POST   | `/api/launches`       | Create a new launch      |
| PUT    | `/api/launches/<id>`  | Update a launch          |
| DELETE | `/api/launches/<id>`  | Delete a launch          |

**Query Parameters for GET `/api/launches`:**

| Parameter    | Description                        |
|--------------|------------------------------------|
| `page`       | Page number (default: 1)           |
| `limit`      | Records per page (default: 20)     |
| `search`     | Search by mission name             |
| `company_id` | Filter by company ID               |
| `status`     | Filter by mission status           |
| `rocket_id`  | Filter by rocket ID                |
| `site_id`    | Filter by launch site ID           |
| `year_from`  | Filter from launch year            |
| `year_to`    | Filter to launch year              |
| `sort_by`    | Sort field                         |
| `date_order` | `asc` or `desc`                    |

---

### Satellites

| Method | Endpoint               | Description               |
|--------|------------------------|---------------------------|
| GET    | `/api/satellites`      | List satellites (paginated, filterable) |
| GET    | `/api/satellites/<id>` | Get a single satellite    |
| POST   | `/api/satellites`      | Create a new satellite    |
| PUT    | `/api/satellites/<id>` | Update a satellite        |
| DELETE | `/api/satellites/<id>` | Delete a satellite        |

**Query Parameters for GET `/api/satellites`:**

| Parameter      | Description                        |
|----------------|------------------------------------|
| `page`         | Page number (default: 1)           |
| `limit`        | Records per page (default: 20)     |
| `search`       | Search by satellite name           |
| `orbit`        | Filter by orbit class              |
| `purpose_id`   | Filter by purpose ID               |
| `operator_id`  | Filter by operator ID              |
| `country_id`   | Filter by country ID               |
| `year_from`    | Filter from launch year            |
| `year_to`      | Filter to launch year              |
| `mass_min`     | Minimum launch mass (kg)           |
| `mass_max`     | Maximum launch mass (kg)           |
| `lifetime_min` | Minimum expected lifetime (years)  |
| `lifetime_max` | Maximum expected lifetime (years)  |
| `sort_by`      | Sort field                         |
| `date_order`   | `asc` or `desc`                    |

---

### Lookups

| Method | Endpoint                   | Description              |
|--------|----------------------------|--------------------------|
| GET    | `/api/lookup/companies`    | All companies            |
| GET    | `/api/lookup/rockets`      | All rockets              |
| GET    | `/api/lookup/launch-sites` | All launch sites         |
| GET    | `/api/lookup/orbit-types`  | All orbit types          |
| GET    | `/api/lookup/operators`    | All operators            |
| GET    | `/api/lookup/purposes`     | All mission purposes     |
| GET    | `/api/lookup/contractors`  | All contractors          |
| GET    | `/api/lookup/vehicles`     | All launch vehicles      |
| GET    | `/api/lookup/countries`    | All countries            |

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is open source. Feel free to use and modify it.
