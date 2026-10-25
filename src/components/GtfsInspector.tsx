import { useRef, useState, type ChangeEvent } from 'react';
import { validateGtfsFiles, type GtfsValidationReport } from '../data/gtfs';

import { buildGtfsPreview, parseGtfsTables, type GtfsPreviewData } from '../data/gtfsPreview';
import { GtfsPreview } from './GtfsPreview';

const MAX_TOTAL_BYTES = 60 * 1024 * 1024;

export function GtfsInspector() {
  const requestId = useRef(0);
  const [previewVersion, setPreviewVersion] = useState(0);
  const [preview, setPreview] = useState<GtfsPreviewData | null>(null);
  const [report, setReport] = useState<GtfsValidationReport | null>(null);
  const [inputError, setInputError] = useState('');
  const [isValidating, setIsValidating] = useState(false);

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const currentRequest = ++requestId.current;
    setPreviewVersion((version) => version + 1);
    const selectedFiles = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    setPreview(null);
    setIsValidating(false);
    setReport(null);
    setInputError('');
    if (selectedFiles.length === 0) return;

    if (selectedFiles.some((file) => !file.name.toLowerCase().endsWith('.txt'))) {
      setInputError(
        'Elegí archivos .txt extraídos de un conjunto GTFS. Descomprimí el ZIP antes de seleccionarlos.',
      );
      return;
    }
    const names = selectedFiles.map((file) => file.name.toLowerCase());
    if (new Set(names).size !== names.length) {
      setInputError('Hay nombres repetidos. Seleccioná una sola versión de cada archivo GTFS.');
      return;
    }
    const totalBytes = selectedFiles.reduce((total, file) => total + file.size, 0);
    if (totalBytes > MAX_TOTAL_BYTES) {
      setInputError(
        'La selección supera los 60 MB. Este límite reduce el uso excesivo de memoria en el navegador.',
      );
      return;
    }

    setIsValidating(true);
    try {
      const contents = await Promise.all(selectedFiles.map((file) => file.text()));
      if (currentRequest !== requestId.current) return;
      const files: Record<string, string> = {};
      selectedFiles.forEach((file, index) => {
        files[file.name] = contents[index] ?? '';
      });
      const tables = parseGtfsTables(files);
      setReport(validateGtfsFiles(files, tables));
      setPreview(buildGtfsPreview(files, tables));
    } catch {
      if (currentRequest !== requestId.current) return;
      setInputError(
        'No se pudieron leer los archivos seleccionados. Revisá que se puedan abrir e intentá otra vez.',
      );
    } finally {
      if (currentRequest === requestId.current) setIsValidating(false);
    }
  }

  return (
    <section className="gtfs-inspector" aria-labelledby="gtfs-inspector-title">
      <div className="gtfs-inspector-intro">
        <p className="section-kicker">PREPARACIÓN DE DATOS</p>
        <h3 id="gtfs-inspector-title">Revisar un conjunto GTFS</h3>
        <p>
          Seleccioná archivos de texto de un conjunto de transporte para revisar su estructura antes
          de considerar cualquier futura integración. No hace falta conectar una fuente para usar
          esta herramienta.
        </p>
      </div>

      <div className="gtfs-privacy-note">
        <span aria-hidden="true">i</span>
        <p>
          Los archivos se leen en esta pestaña: no se suben ni se guardan en un servidor. La vista
          geográfica es opcional y usa solo el conjunto seleccionado. Este informe tampoco verifica
          el origen, la vigencia, la licencia ni los permisos.
        </p>
      </div>

      <label className="gtfs-file-picker" htmlFor="gtfs-files">
        <span className="gtfs-file-picker-title">Elegir archivos GTFS (.txt)</span>
        <span className="gtfs-file-picker-hint">
          Descomprimí el conjunto y elegí agency.txt, routes.txt, stops.txt, trips.txt,
          stop_times.txt y calendar.txt o calendar_dates.txt.
        </span>
        <input
          id="gtfs-files"
          type="file"
          multiple
          accept=".txt,text/plain"
          onChange={handleFilesChange}
          aria-describedby="gtfs-file-help"
        />
      </label>
      <p className="field-hint" id="gtfs-file-help">
        Revisa CSV, columnas, referencias, coordenadas, calendarios y secuencias básicas de paradas.
        Límite: 60 MB por selección. No se comprueban todos los archivos opcionales del estándar.
      </p>

      <button
        className="secondary-button"
        type="button"
        onClick={() => {
          requestId.current += 1;
          setPreview(null);
          setReport(null);
          setInputError('');
          setIsValidating(false);
        }}
      >
        Limpiar importación
      </button>

      {preview && <GtfsPreview key={previewVersion} data={preview} />}

      {isValidating && (
        <p className="gtfs-feedback" role="status">
          Leyendo y revisando los archivos localmente…
        </p>
      )}
      {inputError && (
        <p className="gtfs-feedback gtfs-feedback-error" role="alert">
          {inputError}
        </p>
      )}

      {report && (
        <section
          className={
            report.valid ? 'gtfs-report gtfs-report-valid' : 'gtfs-report gtfs-report-invalid'
          }
          aria-labelledby="gtfs-report-title"
          aria-live="polite"
        >
          <div className="gtfs-report-heading">
            <div>
              <h4 id="gtfs-report-title">
                {report.valid
                  ? 'La estructura básica parece coherente'
                  : 'Se encontraron problemas'}
              </h4>
              <p>
                {report.errors} errores · {report.warnings} advertencias
              </p>
            </div>
            <span
              className={
                report.valid
                  ? 'gtfs-result-pill gtfs-result-ok'
                  : 'gtfs-result-pill gtfs-result-error'
              }
            >
              {report.valid ? 'Sin errores detectados' : 'Revisar archivos'}
            </span>
          </div>

          <dl className="gtfs-summary">
            <div>
              <dt>Agencias</dt>
              <dd>{report.summary.agencies}</dd>
            </div>
            <div>
              <dt>Líneas</dt>
              <dd>{report.summary.routes}</dd>
            </div>
            <div>
              <dt>Paradas</dt>
              <dd>{report.summary.stops}</dd>
            </div>
            <div>
              <dt>Viajes</dt>
              <dd>{report.summary.trips}</dd>
            </div>
            <div>
              <dt>Horarios de parada</dt>
              <dd>{report.summary.stopTimes}</dd>
            </div>
          </dl>

          {report.issues.length > 0 ? (
            <ul className="gtfs-issues" aria-label="Resultados de la revisión">
              {report.issues.map((issue, index) => (
                <li
                  className={
                    issue.severity === 'error' ? 'gtfs-issue gtfs-issue-error' : 'gtfs-issue'
                  }
                  key={issue.code + '-' + index}
                >
                  <strong>{issue.severity === 'error' ? 'Error' : 'Advertencia'}</strong>
                  <span>
                    {issue.file}
                    {issue.row ? `, fila ${issue.row}` : ''}: {issue.message}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="gtfs-clean-note">
              No se encontraron problemas en las comprobaciones incluidas en esta versión.
            </p>
          )}

          {report.omittedIssues > 0 && (
            <p className="field-hint">
              Se omitieron {report.omittedIssues} incidencias adicionales para mantener legible el
              informe.
            </p>
          )}
          <p className="gtfs-report-limit">
            Un informe sin errores no acredita vigencia, exactitud, licencia ni autorización. Los
            datos se muestran solo como una vista previa local, sin conectar una fuente de SAETA.
            Este no es un validador oficial completo de GTFS.
          </p>
        </section>
      )}
    </section>
  );
}
