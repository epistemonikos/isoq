// Composable para Vue 2 - Export State Management
// Nota: En Vue 2, los composables se implementan como mixins o funciones que retornan objetos

export function useExportState() {
    return {
        data() {
            return {
                exportState: {
                    isLoading: false,
                    error: null,
                    progress: 0,
                    currentStep: '',
                    totalSteps: 0
                }
            }
        },

        methods: {
            startExport(totalSteps = 1) {
                this.exportState.isLoading = true
                this.exportState.error = null
                this.exportState.progress = 0
                this.exportState.currentStep = 'Iniciando exportación...'
                this.exportState.totalSteps = totalSteps
            },

            finishExport() {
                this.exportState.isLoading = false
                this.exportState.progress = 100
                this.exportState.currentStep = 'Exportación completada'
            },

            setError(error) {
                this.exportState.isLoading = false
                this.exportState.error = error
                this.exportState.currentStep = 'Error en la exportación'
            },

            updateProgress(progress, step = '') {
                this.exportState.progress = Math.min(progress, 100)
                if (step) {
                    this.exportState.currentStep = step
                }
            },

            resetState() {
                this.exportState.isLoading = false
                this.exportState.error = null
                this.exportState.progress = 0
                this.exportState.currentStep = ''
                this.exportState.totalSteps = 0
            },

            getProgressPercentage() {
                return Math.round((this.exportState.progress / this.exportState.totalSteps) * 100)
            }
        }
    }
}