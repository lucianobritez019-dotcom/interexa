-- ============================================================
-- InterExa - Schema SQL para Supabase
-- ============================================================

-- Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  ci VARCHAR(20) UNIQUE NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NOT NULL,
  email VARCHAR(200),
  telefono VARCHAR(30),
  pierna_habil VARCHAR(10) CHECK (pierna_habil IN ('derecha', 'izquierda', 'ambas')),
  foto_url TEXT,
  rol VARCHAR(20) NOT NULL DEFAULT 'jugador' CHECK (rol IN ('jugador', 'capitan', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: equipos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.equipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(100) NOT NULL,
  escudo_url TEXT,
  categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('primera', 'ejecutivo', 'master')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: jugadores_equipos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jugadores_equipos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jugador_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  equipo_id UUID REFERENCES public.equipos(id) ON DELETE CASCADE NOT NULL,
  categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('primera', 'ejecutivo', 'master')),
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jugador_id, equipo_id, categoria)
);

-- ============================================================
-- TABLA: torneos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.torneos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre VARCHAR(200) NOT NULL,
  temporada VARCHAR(20) NOT NULL,
  categorias_activas TEXT[] DEFAULT ARRAY['primera', 'ejecutivo', 'master'],
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: fechas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fechas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  torneo_id UUID REFERENCES public.torneos(id) ON DELETE CASCADE NOT NULL,
  numero INTEGER NOT NULL,
  fecha_juego DATE,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(torneo_id, numero)
);

-- ============================================================
-- TABLA: partidos
-- ============================================================
CREATE TABLE IF NOT EXISTS public.partidos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fecha_id UUID REFERENCES public.fechas(id) ON DELETE CASCADE NOT NULL,
  equipo_local_id UUID REFERENCES public.equipos(id) NOT NULL,
  equipo_visitante_id UUID REFERENCES public.equipos(id) NOT NULL,
  categoria VARCHAR(20) NOT NULL CHECK (categoria IN ('primera', 'ejecutivo', 'master')),
  goles_local INTEGER DEFAULT 0,
  goles_visitante INTEGER DEFAULT 0,
  jugado BOOLEAN DEFAULT FALSE,
  walkover BOOLEAN DEFAULT FALSE,
  walkover_equipo_id UUID REFERENCES public.equipos(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: planillas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.planillas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partido_id UUID REFERENCES public.partidos(id) ON DELETE CASCADE NOT NULL,
  equipo_id UUID REFERENCES public.equipos(id) NOT NULL,
  cerrada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partido_id, equipo_id)
);

-- ============================================================
-- TABLA: planilla_jugadores
-- ============================================================
CREATE TABLE IF NOT EXISTS public.planilla_jugadores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planilla_id UUID REFERENCES public.planillas(id) ON DELETE CASCADE NOT NULL,
  jugador_id UUID REFERENCES public.profiles(id) NOT NULL,
  presente BOOLEAN DEFAULT FALSE,
  goles INTEGER DEFAULT 0,
  amarilla BOOLEAN DEFAULT FALSE,
  doble_amarilla BOOLEAN DEFAULT FALSE,
  roja_directa BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(planilla_id, jugador_id)
);

-- ============================================================
-- TABLA: sanciones
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sanciones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jugador_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('suspension_amarillas', 'suspension_roja', 'multa_amarilla', 'multa_roja')),
  fecha_id_suspension UUID REFERENCES public.fechas(id),
  pagada BOOLEAN DEFAULT FALSE,
  monto DECIMAL(10,2) DEFAULT 0,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: cuotas
-- ============================================================
CREATE TABLE IF NOT EXISTS public.cuotas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  jugador_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INTEGER NOT NULL,
  monto DECIMAL(10,2) NOT NULL DEFAULT 0,
  pagada BOOLEAN DEFAULT FALSE,
  fecha_pago DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(jugador_id, mes, anio)
);

-- ============================================================
-- TABLA: config_torneo
-- ============================================================
CREATE TABLE IF NOT EXISTS public.config_torneo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  torneo_id UUID REFERENCES public.torneos(id) ON DELETE CASCADE,
  amarillas_limite INTEGER DEFAULT 3,
  multa_amarilla DECIMAL(10,2) DEFAULT 100,
  multa_roja DECIMAL(10,2) DEFAULT 300,
  puntos_victoria INTEGER DEFAULT 3,
  puntos_empate INTEGER DEFAULT 1,
  puntos_derrota INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VISTAS PARA POSICIONES
-- ============================================================
CREATE OR REPLACE VIEW public.posiciones AS
SELECT
  e.id AS equipo_id,
  e.nombre AS equipo,
  e.escudo_url,
  e.categoria,
  COUNT(p.id) AS pj,
  SUM(CASE
    WHEN p.walkover AND p.walkover_equipo_id = e.id THEN 0
    WHEN p.walkover AND p.walkover_equipo_id != e.id THEN 1
    WHEN NOT p.walkover AND p.jugado AND p.equipo_local_id = e.id AND p.goles_local > p.goles_visitante THEN 1
    WHEN NOT p.walkover AND p.jugado AND p.equipo_visitante_id = e.id AND p.goles_visitante > p.goles_local THEN 1
    ELSE 0
  END) AS ganados,
  SUM(CASE
    WHEN p.walkover THEN 0
    WHEN p.jugado AND p.goles_local = p.goles_visitante THEN 1
    ELSE 0
  END) AS empatados,
  SUM(CASE
    WHEN p.walkover AND p.walkover_equipo_id = e.id THEN 1
    WHEN NOT p.walkover AND p.jugado AND p.equipo_local_id = e.id AND p.goles_local < p.goles_visitante THEN 1
    WHEN NOT p.walkover AND p.jugado AND p.equipo_visitante_id = e.id AND p.goles_visitante < p.goles_local THEN 1
    ELSE 0
  END) AS perdidos,
  SUM(CASE
    WHEN p.walkover AND p.walkover_equipo_id != e.id THEN 3
    WHEN p.jugado AND p.equipo_local_id = e.id THEN p.goles_local
    WHEN p.jugado AND p.equipo_visitante_id = e.id THEN p.goles_visitante
    ELSE 0
  END) AS goles_favor,
  SUM(CASE
    WHEN p.walkover THEN 0
    WHEN p.jugado AND p.equipo_local_id = e.id THEN p.goles_visitante
    WHEN p.jugado AND p.equipo_visitante_id = e.id THEN p.goles_local
    ELSE 0
  END) AS goles_contra,
  (
    SUM(CASE
      WHEN p.walkover AND p.walkover_equipo_id != e.id THEN 3
      WHEN p.jugado AND p.equipo_local_id = e.id THEN p.goles_local
      WHEN p.jugado AND p.equipo_visitante_id = e.id THEN p.goles_visitante
      ELSE 0
    END)
    -
    SUM(CASE
      WHEN p.walkover THEN 0
      WHEN p.jugado AND p.equipo_local_id = e.id THEN p.goles_visitante
      WHEN p.jugado AND p.equipo_visitante_id = e.id THEN p.goles_local
      ELSE 0
    END)
  ) AS diferencia,
  SUM(CASE
    WHEN p.walkover AND p.walkover_equipo_id = e.id THEN 0
    WHEN p.walkover AND p.walkover_equipo_id != e.id THEN 3
    WHEN p.jugado AND p.equipo_local_id = e.id AND p.goles_local > p.goles_visitante THEN 3
    WHEN p.jugado AND p.equipo_visitante_id = e.id AND p.goles_visitante > p.goles_local THEN 3
    WHEN p.jugado AND p.goles_local = p.goles_visitante THEN 1
    ELSE 0
  END) AS puntos
FROM public.equipos e
JOIN public.partidos p ON (p.equipo_local_id = e.id OR p.equipo_visitante_id = e.id)
WHERE p.jugado = TRUE OR p.walkover = TRUE
GROUP BY e.id, e.nombre, e.escudo_url, e.categoria;

-- ============================================================
-- VISTA: GOLEADORES
-- ============================================================
CREATE OR REPLACE VIEW public.tabla_goleadores AS
SELECT
  pr.id AS jugador_id,
  pr.nombre,
  pr.apellido,
  pr.foto_url,
  e.nombre AS equipo,
  je.categoria,
  SUM(pj.goles) AS total_goles
FROM public.planilla_jugadores pj
JOIN public.profiles pr ON pr.id = pj.jugador_id
JOIN public.planillas pl ON pl.id = pj.planilla_id
JOIN public.jugadores_equipos je ON je.jugador_id = pr.id AND je.equipo_id = pl.equipo_id
JOIN public.equipos e ON e.id = je.equipo_id
WHERE pj.goles > 0
GROUP BY pr.id, pr.nombre, pr.apellido, pr.foto_url, e.nombre, je.categoria
ORDER BY total_goles DESC;

-- ============================================================
-- VISTA: VALLAS MENOS VENCIDAS
-- ============================================================
CREATE OR REPLACE VIEW public.tabla_vallas AS
SELECT
  e.id AS equipo_id,
  e.nombre AS equipo,
  e.escudo_url,
  e.categoria,
  COUNT(p.id) AS partidos_jugados,
  SUM(CASE
    WHEN p.equipo_local_id = e.id THEN p.goles_visitante
    WHEN p.equipo_visitante_id = e.id THEN p.goles_local
    ELSE 0
  END) AS goles_recibidos,
  SUM(CASE
    WHEN (p.equipo_local_id = e.id AND p.goles_visitante = 0) THEN 1
    WHEN (p.equipo_visitante_id = e.id AND p.goles_local = 0) THEN 1
    ELSE 0
  END) AS porterias_imbatidas
FROM public.equipos e
JOIN public.partidos p ON (p.equipo_local_id = e.id OR p.equipo_visitante_id = e.id)
WHERE p.jugado = TRUE
GROUP BY e.id, e.nombre, e.escudo_url, e.categoria
ORDER BY goles_recibidos ASC;

-- ============================================================
-- VISTA: FAIR PLAY
-- ============================================================
CREATE OR REPLACE VIEW public.tabla_fair_play AS
SELECT
  e.id AS equipo_id,
  e.nombre AS equipo,
  e.categoria,
  COUNT(DISTINCT p.id) AS partidos_jugados,
  SUM(CASE WHEN pj.amarilla THEN 1 ELSE 0 END) AS amarillas,
  SUM(CASE WHEN pj.doble_amarilla THEN 1 ELSE 0 END) AS dobles_amarillas,
  SUM(CASE WHEN pj.roja_directa THEN 1 ELSE 0 END) AS rojas_directas,
  (
    SUM(CASE WHEN pj.amarilla THEN 1 ELSE 0 END) * 1 +
    SUM(CASE WHEN pj.doble_amarilla THEN 1 ELSE 0 END) * 3 +
    SUM(CASE WHEN pj.roja_directa THEN 1 ELSE 0 END) * 5
  ) AS puntos_negativos
FROM public.equipos e
JOIN public.planillas pl ON pl.equipo_id = e.id
JOIN public.partidos p ON p.id = pl.partido_id
JOIN public.planilla_jugadores pj ON pj.planilla_id = pl.id
WHERE p.jugado = TRUE
GROUP BY e.id, e.nombre, e.categoria
ORDER BY puntos_negativos ASC;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jugadores_equipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.torneos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fechas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planilla_jugadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sanciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cuotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.config_torneo ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- EQUIPOS (lectura pública)
CREATE POLICY "equipos_select_public" ON public.equipos
  FOR SELECT USING (true);

CREATE POLICY "equipos_all_admin" ON public.equipos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- JUGADORES_EQUIPOS (lectura pública)
CREATE POLICY "jugadores_equipos_select_public" ON public.jugadores_equipos
  FOR SELECT USING (true);

CREATE POLICY "jugadores_equipos_all_admin" ON public.jugadores_equipos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- TORNEOS (lectura pública)
CREATE POLICY "torneos_select_public" ON public.torneos
  FOR SELECT USING (true);

CREATE POLICY "torneos_all_admin" ON public.torneos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- FECHAS (lectura pública)
CREATE POLICY "fechas_select_public" ON public.fechas
  FOR SELECT USING (true);

CREATE POLICY "fechas_all_admin" ON public.fechas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- PARTIDOS (lectura pública)
CREATE POLICY "partidos_select_public" ON public.partidos
  FOR SELECT USING (true);

CREATE POLICY "partidos_all_admin" ON public.partidos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- PLANILLAS (lectura pública)
CREATE POLICY "planillas_select_public" ON public.planillas
  FOR SELECT USING (true);

CREATE POLICY "planillas_all_admin" ON public.planillas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- PLANILLA_JUGADORES (lectura pública)
CREATE POLICY "planilla_jugadores_select_public" ON public.planilla_jugadores
  FOR SELECT USING (true);

CREATE POLICY "planilla_jugadores_all_admin" ON public.planilla_jugadores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- SANCIONES (usuario ve las suyas, admin ve todas)
CREATE POLICY "sanciones_select_own" ON public.sanciones
  FOR SELECT USING (
    jugador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "sanciones_select_admin" ON public.sanciones
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "sanciones_all_admin" ON public.sanciones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- CUOTAS (usuario ve las suyas, admin ve todas)
CREATE POLICY "cuotas_select_own" ON public.cuotas
  FOR SELECT USING (
    jugador_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "cuotas_select_admin" ON public.cuotas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

CREATE POLICY "cuotas_all_admin" ON public.cuotas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- CONFIG_TORNEO (lectura pública, escritura admin)
CREATE POLICY "config_select_public" ON public.config_torneo
  FOR SELECT USING (true);

CREATE POLICY "config_all_admin" ON public.config_torneo
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND rol = 'admin')
  );

-- ============================================================
-- FUNCIÓN: trigger para actualizar updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_partidos
  BEFORE UPDATE ON public.partidos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_planillas
  BEFORE UPDATE ON public.planillas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_sanciones
  BEFORE UPDATE ON public.sanciones
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_cuotas
  BEFORE UPDATE ON public.cuotas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCIÓN: crear perfil automáticamente al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, ci, nombre, apellido, email, rol)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'ci', ''),
    COALESCE(NEW.raw_user_meta_data->>'nombre', ''),
    COALESCE(NEW.raw_user_meta_data->>'apellido', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'jugador')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- DATOS INICIALES
-- ============================================================
INSERT INTO public.torneos (nombre, temporada, activo)
VALUES ('Torneo Apertura 2025', '2025', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.config_torneo (amarillas_limite, multa_amarilla, multa_roja, puntos_victoria, puntos_empate, puntos_derrota)
VALUES (3, 100, 300, 3, 1, 0)
ON CONFLICT DO NOTHING;
