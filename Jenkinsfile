pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        sh 'yarn install'
        sh 'yarn build:prod'
      }
    }

    stage('Deploy') {
      when {
        branch 'master'
      }
      environment {
        docker_pwd = credentials('docker_pwd')
        sonar_login = credentials('sonar_login')
        webhook_api = credentials('webhook_api')
      }
      steps {
        sh 'docker login -u "admin" -p "$docker_pwd" amrita-elective.tk:5000'
        sh 'docker build -t amrita-elective.tk:5000/api .'
        sh 'docker push amrita-elective.tk:5000/api'
        sh 'sonar-scanner -Dsonar.login="$sonar_login"'
        sh 'docker rmi amrita-elective.tk:5000/api'
        sh 'curl -d \'{ "user": "admin", "pwd": "$webhook_api" }\' -H \'Content-Type: application/json\' --request POST http://amrita-elective.tk:4000/new-api-container'
      }
    }

    stage('Integrate') {
      when {
        not {
          branch 'master'
        }

      }
      steps {
        sh 'yarn test:unit'
        sh 'yarn test:integration'
      }
    }
  }
}
