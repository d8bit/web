pipeline {
    agent any
    // Variables de projecto.
    parameters {
        // Url de web de producción
        string(name: 'WEBSITE', defaultValue: 'https://www.d8bit.com', description: 'Website')
        // Url de web de pre-producción
        string(name: 'TESTWEBSITE', defaultValue: 'http://d8bit.rwdesarrollos.es', description: 'Website')
        // Identificador del proyecto en Jenkins
        string(name: 'JENKINSPROJECTKEY', defaultValue: 'd8bit', description: 'Jenkins project key')
        // Identificador del proyecto en SonarQube
        string(name: 'SONARPROJECTKEY', defaultValue: 'd8bit', description: 'Sonar project key')
        // Rutas del proyecto a analizar mediante SonarQube
        string(name: 'SONARSOURCES', defaultValue: './backend/app,./frontend/app,./frontend/resources/views', description: 'Sonar sources')
        // Rutas del proyecto a ignorar mediante SonarQube
        string(name: 'SONAREXCLUSIONS', defaultValue: '/backend/app/Helper/**/*,/backend/app/Providers/**/*,/frontend/app/Providers/**/*', description: 'Sonar exclusions')
    }
    stages {
        // Cambia el estado del proyecto en Gitlab para indicar que se está
        // ejectuando Jenkins
        stage('Update Gitlab') {
            steps {
                updateGitlabCommitStatus(name: 'jenkins-build', state: 'running')
            }
        }
        stage('Required') {
            failFast false
            parallel {
                // Comprueba mediante curl que existe el fichero sitemap.xml
                stage('Sitemap') {
                    steps {
                        script {
                            if (env.BRANCH_NAME == 'master') {
                                echo 'jenkinsTest branch'
                                sh '''sitemapContent=`curl -Is "${WEBSITE}/sitemap.xml" | head -1`
                                    if [[ $sitemapContent != *"200"* ]]; then
                                      echo "No sitemap file found"
                                      exit 1
                                    fi'''
                            } else {
                                sh '''sitemapContent=`curl -Is "${TESTWEBSITE}/sitemap.xml" | head -1`
                                    if [[ $sitemapContent != *"200"* ]]; then
                                      echo "No sitemap file found"
                                      exit 1
                                    fi'''
                            }
                        }
                    }
                }
                // Comprueba mediante curl que existe el fichero robots.txt
                stage('Robots') {
                    steps {
                        script {
                            if (env.BRANCH_NAME == 'master') {
                                sh '''robotsContent=`curl -Is "${WEBSITE}/robots.txt" | head -1`
                                    if [[ $robotsContent != *"200"* ]]; then
                                      echo "No robots file found"
                                      exit 1
                                    else
                                        robotsContent=`curl -s "${WEBSITE}" | grep -c "Disallow: /" || true`
                                        if [ ${robotsContent} -gt 0 ]
                                        then
                                            echo "Disallowing all"
                                            exit 1
                                        else
                                            echo "Allowing all"
                                        fi
                                    fi'''
                            } else {
                                // En preproducción hay que desabilitar toda
                                // la web
                                sh '''robotsContent=`curl -Is "${TESTWEBSITE}/robots.txt" | head -1`
                                    if [[ $robotsContent != *"200"* ]]; then
                                      echo "No robots file found"
                                      exit 1
                                    else
                                        robotsContent=`curl -s "${TESTWEBSITE}/robots.txt" | grep -c "Disallow: /" || true`
                                        if [ ${robotsContent} -gt 0 ]
                                        then
                                            echo "Disallowing all"
                                        else
                                            echo "Allowing all"
                                            exit 1
                                        fi
                                    fi'''
                            }
                        }
                    }
                }
                // Comprueba mediante Curl que si se pone 'index.php' en la
                // URL se hace una redirección quitando el 'index.php'
                stage('No index.php') {
                    steps {
                        script {
                            if (env.BRANCH_NAME == 'master') {
                                sh '''redirectUrl=`curl -Ls -o /dev/null -w %{url_effective} ${WEBSITE}/index.php`
                                    if [[ $redirectUrl =~ .*index.php.* ]]; then
                                        echo "No redirecting from index.php. Modify htaccess."
                                        exit 1
                                    fi'''
                            } else {
                                sh '''redirectUrl=`curl -Ls -o /dev/null -w %{url_effective} ${TESTWEBSITE}/index.php`
                                    if [[ $redirectUrl =~ .*index.php.* ]]; then
                                        echo "No redirecting from index.php. Modify htaccess."
                                        exit 1
                                    fi'''
                            }
                        }
                    }
                }
                // Comprueba que en producción existe el Google Tag Manager
                // y que en preproducción no existe
                stage ('Google Tag Manager') {
                    steps {
                        script {
                            if (env.BRANCH_NAME == 'master') {
                                sh '''tagsFound=`curl -s "${WEBSITE}" | grep -c "Google Tag Manager" || true`
                                    if [ ${tagsFound} -gt 0 ]
                                    then
                                        echo "Google Tag Manager found"
                                    else
                                        echo "Google Tag Manager NOT found"
                                        exit 1
                                    fi'''
                            } else {
                                sh '''tagsFound=`curl -s "${TESTWEBSITE}" | grep -c "Google Tag Manager" || true`
                                    if [ ${tagsFound} -gt 0 ]
                                    then
                                        echo "Google Tag Manager found"
                                        exit 1
                                    else
                                        echo "Google Tag Manager NOT found"
                                    fi'''
                            }
                        }
                    }
                }
            }
        }
        stage ('Dev content') {
            failFast true
            parallel {
                // Comprueba si hay 'lorem ipsum' en el código
                stage('LoremIpsum') {
                    steps {
                        script {
                            sh returnStatus: true, script: '''results=`grep -ri "lorem ipsum" . --exclude=jenkins-ci --exclude-dir=maqueta --exclude-dir=vendor --exclude-dir=node_modules --exclude-dir=ci --exclude=loremIpsum.txt|tee loremIpsum.txt`
                                echo ${#results}
                                if  [ ${#results} -gt 0 ]
                                then
                                    exit 1
                                else
                                    exit 0
                                fi'''
                        }
                        publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: '', reportFiles: 'loremIpsum.txt', reportName: 'Lorem Ipsum Report', reportTitles: ''])
                    }
                }
                stage('RwEmail') {
                    steps {
                        script {
                            sh '''results=`grep -ri "@d8bit" . --exclude=jenkins-ci --exclude-dir=vendor --exclude-dir=node_modules --exclude-dir=ci|tee rwmail.txt`'''
                        }
                        publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: '', reportFiles: 'rwmail.txt', reportName: 'RW mail report', reportTitles: ''])
                    }
                }
                // Comprueba si existen links externos sin SSL en el código
                stage ('Links without SSL') {
                    steps {
                        script {
                            sh '''linksFound=`grep -ri "http://" . --exclude-dir=\\*{vendor,node_modules} --exclude=\\*.{js,css,svg,xml,md,ttf,eot,map,lock} --exclude=tags`
                                echo ${linksFound}
                                if [ ${#linksFound} -gt 0 ]
                                then
                                    exit 0
                                fi'''
                        }
                        publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: '', reportFiles: 'SslLinks.txt', reportName: 'SSL links Report', reportTitles: ''])
                    }
                }
            }
        }
        // Ejecuta Lighthouse de Google para analizar la web
        stage('lighthouse') {
            steps {
                script {
                    sh 'npm install lighthouse'
                    if (env.BRANCH_NAME == 'master') {
                        sh "node_modules/lighthouse/lighthouse-cli/index.js --output-path=./lighthouse-report.html --quiet --throttling-method=provided --chrome-flags='--headless --no-sandbox' ${WEBSITE}"
                    } else {
                        sh "node_modules/lighthouse/lighthouse-cli/index.js --output-path=./lighthouse-report.html --quiet --throttling-method=provided --chrome-flags='--headless --no-sandbox' ${TESTWEBSITE}"
                    }
                }
                publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: '', reportFiles: 'lighthouse-report.html', reportName: 'Lighthouse Report', reportTitles: ''])
            }
        }
        stage('SonarQubeAnalysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    script {
                        sh '''/opt/sonar-scanner-3.0.3.778-linux/bin/sonar-scanner \\
                            -Dsonar.projectKey=${SONARPROJECTKEY} \\
                            -Dsonar.sources=${SONARSOURCES} \\
                            -Dsonar.exclusions=${SONAREXCLUSIONS} \\
                            -Dsonar.login=a3ff8d0bc6273674b93f265e6898a98da9be9be0'''
                    }
                }
            }
        }
        // Comprueba todos los links de la web  en busca de errores
        stage('BrokenLinks') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'master') {
                        sh '''results=`/usr/local/bin/checkLinks ${WEBSITE}`
                            if  [ ${#results} -gt 0 ]
                            then
                                echo ${results}
                                exit 1
                            else
                                exit 0
                            fi'''
                    } else {
                        sh '''results=`/usr/local/bin/checkLinks ${TESTWEBSITE}`
                            if  [ ${#results} -gt 0 ]
                            then
                                echo ${results}
                                exit 1
                            else
                                exit 0
                            fi'''
                    }

                }
                publishHTML([allowMissing: false, alwaysLinkToLastBuild: true, keepAll: true, reportDir: '', reportFiles: 'log.txt', reportName: 'Links log', reportTitles: ''])
            }
        }
    }
    post {
        failure {
            echo 'Failed'
            updateGitlabCommitStatus(name: 'jenkins-build', state: 'failed')
            emailext body: 'Build broken: ${JOB_URL}', recipientProviders: [developers()], subject: '${JOB_NAME} CI broken'
        }
        aborted {
            echo 'Aborted'
        }
        success {
            updateGitlabCommitStatus(name: 'jenkins-build', state: 'success')
            emailext body: '''Build successful: ${JOB_URL}
            Lighthouse report: ${JOB_URL}Lighthouse_20Report/
            SonarQube report: http://jenkins.d8bit.com:9000/dashboard?id=${JENKINSPROJECTKEY}''', recipientProviders: [developers()], subject: '${JOB_NAME} CI OK'
        }
        always {
            cleanWs()
        }
    }
}
