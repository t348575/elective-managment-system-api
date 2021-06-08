pipeline {
  agent any
  stages {
    when {
      branch 'master'
    }
    stage('Install') {
      steps {
        sh 'yarn install'
      }
    }

    stage('Build') {
      steps {
        sh 'yarn build:prod'
      }
    }

    stage('Unit tests') {
      steps {
        sh 'yarn test:unit'
      }
    }

    stage('Integration tests') {
      steps {
        sh 'yarn test:integration'
      }
    }

    stage('Static code analysis') {
      steps {
        sh 'sonar-scanner -Dsonar.login="6ffd0b5dfbc1cfaf150add2d6f65f22e450200ce"'
      }
    }

    stage('Docker') {
      steps {
        sh 'docker login -u "admin" -p "26bac9a06d51fab3a396f9afe2b22678" amrita-elective.tk:5000'
        sh 'docker build -t amrita-elective.tk:5000/api .'
        sh 'docker push amrita-elective.tk:5000/api'
      }
    }
  }
}
